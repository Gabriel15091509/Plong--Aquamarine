const BaseService = require('./BaseService');
const PlongeeRepository = require('../repositories/PlongeeRepository');
const AttributionRepository = require('../repositories/AttributionRepository');
const identiteClient = require('../utils/serviceClients/identiteClient');
const formationClient = require('../utils/serviceClients/formationClient');
const vieAssociativeClient = require('../utils/serviceClients/vieAssociativeClient');
const materielClient = require('../utils/serviceClients/materielClient');
const { withAdherent, withMoniteurEncadrant } = require('../utils/enrichAdherents');

const SIX_MOIS_MS = 6 * 30 * 24 * 60 * 60 * 1000;

class PlongeeService extends BaseService {
  constructor() {
    const repository = new PlongeeRepository();
    super(repository);
    this.plongeeRepository = repository;
    this.attributionRepository = new AttributionRepository();
  }

  // Matériel utilisé par plongée (CDC 3.3.1 : "Matériel utilisé (bloc,
  // détendeur, combinaison)"). Résolu depuis les Attribution du même
  // adhérent liées à la même sortie — Attribution vit dans ce même service/
  // schéma que Plongee (pas d'appel HTTP pour établir le lien), seul le
  // libellé du matériel lui-même (catégorie/marque/modèle) vient de
  // materiel-service. Best-effort : une panne de materiel-service ne doit
  // jamais empêcher l'affichage du carnet, seulement laisser un matériel non
  // résolu (num_inventaire seul).
  async attachMaterielUtilise(plongeeOrPlongees) {
    const isArray = Array.isArray(plongeeOrPlongees);
    const list = isArray ? plongeeOrPlongees : [plongeeOrPlongees].filter(Boolean);
    const materielCache = new Map();

    const plains = await Promise.all(
      list.map(async (plongee) => {
        const plain = plongee?.toJSON ? plongee.toJSON() : plongee;
        if (!plain) return plain;

        const attributions = await this.attributionRepository.findByAdherentAndSortie(
          plain.num_adherent,
          plain.id_sortie,
        );

        plain.materiel_utilise = await Promise.all(
          attributions.map(async (attribution) => {
            if (!materielCache.has(attribution.num_inventaire)) {
              materielCache.set(
                attribution.num_inventaire,
                materielClient.getByNumInventaire(attribution.num_inventaire).catch(() => null),
              );
            }
            const materiel = await materielCache.get(attribution.num_inventaire);
            return {
              num_inventaire: attribution.num_inventaire,
              categorie: materiel?.categorie || null,
              marque: materiel?.marque || null,
              modele: materiel?.modele || null,
            };
          }),
        );

        return plain;
      }),
    );

    return isArray ? plains : plains[0];
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
    const plongees = await this.plongeeRepository.findPlongeesByAdherent(num_adherent);
    return await this.attachMaterielUtilise(plongees);
  }

  // Adherent (identite-service) a quitté ce schéma : chaque membre de la
  // palanquée (`.palanquee.composers[]`) est recomposé avec `.adherent` via
  // withAdherent, et le moniteur encadrant (`.palanquee.moniteur_encadrant`)
  // via withMoniteurEncadrant (voir utils/enrichAdherents.js) : un adhérent
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

    const plain = await this.attachMaterielUtilise(plongee);
    if (plain.palanquee?.composers?.length) {
      plain.palanquee.composers = await withAdherent(plain.palanquee.composers, { authHeader });
    }
    if (plain.palanquee) {
      plain.palanquee = await withMoniteurEncadrant(plain.palanquee);
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

    // Brouillon (créé automatiquement au pointage de présence, voir
    // PalanqueeService.creerPlongeeBrouillon) pas encore complété par le
    // moniteur : le valider tel quel compterait une plongée sans aucune
    // mesure réelle dans le carnet de l'adhérent (voir PlongeeList "À
    // compléter" côté frontend, qui doit être utilisé avant "Valider").
    if (plongee.profondeur_max == null || plongee.duree == null) {
      throw new Error(
        "Cette plongée doit d'abord être complétée (profondeur et durée) avant d'être validée",
      );
    }

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
