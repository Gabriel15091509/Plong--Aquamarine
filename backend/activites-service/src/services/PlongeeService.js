const BaseService = require('./BaseService');
const PlongeeRepository = require('../repositories/PlongeeRepository');
const identiteClient = require('../utils/serviceClients/identiteClient');
const formationClient = require('../utils/serviceClients/formationClient');
const vieAssociativeClient = require('../utils/serviceClients/vieAssociativeClient');
const { withAdherent } = require('../utils/enrichAdherents');

const SIX_MOIS_MS = 6 * 30 * 24 * 60 * 60 * 1000;

class PlongeeService extends BaseService {
  constructor() {
    const repository = new PlongeeRepository();
    super(repository);
    this.plongeeRepository = repository;
  }

  async getAll(user = null) {
    const adherent = await identiteClient.getAdherentForUser(user);
    if (adherent) {
      return await this.plongeeRepository.findPlongeesByAdherent(adherent.num_adherent);
    }
    return await this.plongeeRepository.findAll();
  }

  async getById(id, user = null) {
    const plongee = await this.plongeeRepository.findById(id);
    if (plongee) await this.assertCanAccessPlongee(plongee, user);
    return plongee;
  }

  async assertCanAccessPlongee(plongee, user) {
    const adherent = await identiteClient.getAdherentForUser(user);
    if (adherent && plongee.num_adherent !== adherent.num_adherent) {
      throw new Error("Accès refusé à cette plongée");
    }
  }

  async getPlongeesByAdherent(num_adherent, user = null) {
    const adherent = await identiteClient.getAdherentForUser(user);
    if (adherent && num_adherent !== adherent.num_adherent) {
      throw new Error("Accès refusé à ce carnet de plongée");
    }
    return await this.plongeeRepository.findPlongeesByAdherent(num_adherent);
  }

  // Adherent (identite-service) a quitté ce schéma : chaque membre de la
  // palanquée (`.palanquee.composers[]`) est recomposé avec `.adherent` via
  // identiteClient. Le moniteur encadrant (`.palanquee.moniteur_encadrant`)
  // est résolu de la même façon (id_moniteur -> user_id -> nom) : un adhérent
  // consultant sa propre plongée n'a par ailleurs aucun accès à la liste des
  // moniteurs pour identifier qui encadre sa palanquée (voir la question
  // "qui sera responsable de chaque palanquée" — moniteur encadrant, guide
  // et secouriste ; les deux derniers sont déjà déductibles côté frontend
  // depuis `composers` + `id_guide_palanquee`/`id_secouriste`, pas besoin
  // d'enrichissement ici).
  async getPlongeeWithDetails(id, user = null, authHeader = null) {
    const plongee = await this.plongeeRepository.findPlongeesWithDetails(id);
    if (!plongee) return plongee;
    await this.assertCanAccessPlongee(plongee, user);

    const plain = plongee.toJSON();
    if (plain.palanquee?.composers?.length) {
      plain.palanquee.composers = await withAdherent(plain.palanquee.composers, { authHeader });
    }
    if (plain.palanquee?.id_moniteur_encadrant) {
      // Best-effort : identite-service indisponible ne doit pas faire
      // échouer l'affichage de la plongée elle-même.
      try {
        const moniteur = await identiteClient.getMoniteurById(
          plain.palanquee.id_moniteur_encadrant,
          authHeader,
        );
        const moniteurUser = moniteur?.user_id
          ? await identiteClient.getUserBasicById(moniteur.user_id)
          : null;
        plain.palanquee.moniteur_encadrant = moniteurUser
          ? { id_moniteur: plain.palanquee.id_moniteur_encadrant, name: moniteurUser.name }
          : null;
      } catch (error) {
        console.error("Erreur résolution moniteur encadrant:", error.message);
        plain.palanquee.moniteur_encadrant = null;
      }
    }
    return plain;
  }

  async getPlongeeStats() {
    return await this.plongeeRepository.getStats();
  }

  async getPlongeesByDateRange(startDate, endDate) {
    return await this.plongeeRepository.getPlongeesByDateRange(startDate, endDate);
  }

  async validatePlongeeData(data) {
    const errors = [];

    if (!data.num_adherent) errors.push('L\'adhérent est requis');
    if (!data.date) errors.push('La date est requise');
    if (!data.profondeur_max || data.profondeur_max <= 0) {
      errors.push('La profondeur maximale doit être supérieure à 0');
    }
    if (!data.duree || data.duree <= 0) {
      errors.push('La durée doit être supérieure à 0');
    }
    if (!data.type_plongee) errors.push('Le type de plongée est requis');

    return errors;
  }

  // Une plongée validée par un moniteur (id_moniteur_validateur renseigné) ne
  // doit plus pouvoir être modifiée ni supprimée : le compteur de plongées
  // de l'adhérent a déjà été incrémenté et, le cas échéant, la séance de
  // formation liée déjà marquée réalisée (voir validatePlongee) — une
  // correction a posteriori désynchroniserait ces effets de bord déjà
  // appliqués ailleurs. Même principe que AdhesionService.update/delete
  // (verrou une fois validé).
  assertPlongeeModifiable(plongee) {
    if (plongee.id_moniteur_validateur) {
      throw new Error("Cette plongée est validée : elle n'est plus modifiable.");
    }
  }

  async update(id, data) {
    const plongee = await this.plongeeRepository.findById(id);
    if (!plongee) throw new Error('Plongée non trouvée');
    this.assertPlongeeModifiable(plongee);
    return await this.plongeeRepository.update(id, data);
  }

  async delete(id) {
    const plongee = await this.plongeeRepository.findById(id);
    if (!plongee) throw new Error('Plongée non trouvée');
    this.assertPlongeeModifiable(plongee);
    return await this.plongeeRepository.delete(id);
  }

  // AdherentService (identite-service) : incrémentation du compte de
  // plongées de l'adhérent via HTTP au lieu d'un appel en-process.
  async validatePlongee(id, id_moniteur, authHeader = null) {
    const plongee = await this.getById(id);
    if (!plongee) throw new Error('Plongée non trouvée');
    if (!id_moniteur) throw new Error('Le moniteur validateur est requis');
    // Déjà validée : ne pas ré-incrémenter le compteur de plongées de
    // l'adhérent (double-clic ou nouvelle validation sur une plongée déjà
    // validée par un autre moniteur).
    if (plongee.id_moniteur_validateur) return plongee;

    plongee.id_moniteur_validateur = id_moniteur;
    await plongee.save();

    await identiteClient.incrementPlongeesCount(plongee.num_adherent, authHeader);

    // Best-effort : si cette plongée de formation est liée à une séance
    // pratique planifiée, on la fait progresser à "Réalisée" côté
    // formation-service. Une panne de formation-service ne doit pas bloquer
    // la validation de la plongée elle-même.
    if (plongee.id_seance) {
      try {
        await formationClient.marquerSeanceRealisee(plongee.id_seance, authHeader);
      } catch (error) {
        console.error("Erreur mise à jour séance liée à la plongée:", error.message);
      }
    }

    return plongee;
  }

  // Même calcul que DashboardService.countTrend dans le monolithe — dupliqué
  // ici pour que activites-service reste seul propriétaire de ses données ;
  // exposé via `GET /plongees/trend` pour que le dashboard (qui vit encore
  // dans le monolithe) puisse le récupérer par HTTP au lieu d'une requête
  // Sequelize directe sur un modèle qui ne lui appartient plus.
  async getTrend() {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastPeriod = new Date(startOfLastMonth);
    endOfLastPeriod.setDate(startOfLastMonth.getDate() + now.getDate());

    const [current, previous] = await Promise.all([
      this.plongeeRepository.countInPeriod("date", startOfThisMonth, now),
      this.plongeeRepository.countInPeriod("date", startOfLastMonth, endOfLastPeriod),
    ]);

    let percent;
    if (previous === 0) {
      percent = current === 0 ? 0 : 100;
    } else {
      percent = ((current - previous) / previous) * 100;
    }
    const rounded = Math.round(percent);
    return {
      current,
      previous,
      trend: `${rounded >= 0 ? "+" : ""}${rounded}%`,
      trendUp: rounded >= 0,
    };
  }

  // Alerte "inactivité carnet de plongée" (CDC 3.3.2) : tout adhérent dont la
  // dernière plongée enregistrée remonte à plus de 6 mois génère (ou
  // renouvelle) une alerte dans vie-associative-service. Ne couvre que les
  // adhérents ayant déjà au moins une plongée — un adhérent n'ayant jamais
  // plongé n'a pas de date de référence à comparer. Appelé par un cron (voir
  // app.js) — best-effort, une alerte en échec n'interrompt pas les autres.
  async getInactifs() {
    const seuil = new Date(Date.now() - SIX_MOIS_MS);
    const rows = await this.plongeeRepository.findDerniereDatePlongeeParAdherent();
    return rows.filter((row) => new Date(row.derniere_plongee) < seuil);
  }

  async alerterInactifs() {
    const inactifs = await this.getInactifs();

    for (const row of inactifs) {
      try {
        await vieAssociativeClient.createAlerte(row.num_adherent, "Inactivite plongee");
      } catch (error) {
        console.error(`Erreur alerte inactivité (adhérent ${row.num_adherent}):`, error.message);
      }
    }
    return inactifs.length;
  }
}

module.exports = PlongeeService;
