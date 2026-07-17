const BaseService = require('./BaseService');
const PalanqueeRepository = require('../repositories/PalanqueeRepository');
const {
  Composer,
  Plongee,
  Sortie,
} = require('../models');
const identiteClient = require('../utils/serviceClients/identiteClient');
const materielClient = require('../utils/serviceClients/materielClient');
const { isStaff } = require('../utils/roleScope');
const { withAdherent } = require('../utils/enrichAdherents');

const NIVEAUX_LIMITANTS = ['Baptême', 'Niveau 1'];

class PalanqueeService extends BaseService {
  constructor() {
    const repository = new PalanqueeRepository();
    super(repository);
    this.palanqueeRepository = repository;
  }

  // Adherent (identite-service) a quitté ce schéma : chaque membre
  // (`.composers[]`) est recomposé avec `.adherent` via identiteClient.
  async enrichComposers(palanquees, authHeader) {
    const isArray = Array.isArray(palanquees);
    const list = isArray ? palanquees : [palanquees].filter(Boolean);
    const plains = await Promise.all(
      list.map(async (p) => {
        const plain = p.toJSON ? p.toJSON() : p;
        if (plain.composers?.length) {
          plain.composers = await withAdherent(plain.composers, { authHeader });
        }
        return plain;
      }),
    );
    return isArray ? plains : plains[0];
  }

  async getAll(user = null, authHeader = null) {
    const adherent = await identiteClient.getAdherentForUser(user);
    const results = adherent
      ? await this.palanqueeRepository.findByAdherent(adherent.num_adherent)
      : await this.palanqueeRepository.findAllDetailed();
    return await this.enrichComposers(results, authHeader);
  }

  async getById(id, user = null, authHeader = null) {
    const palanquee = await this.palanqueeRepository.findByIdDetailed(id);
    if (!palanquee) return palanquee;
    await this.assertCanAccessPalanquee(palanquee, user);
    return await this.enrichComposers(palanquee, authHeader);
  }

  async assertCanAccessPalanquee(palanquee, user) {
    const adherent = await identiteClient.getAdherentForUser(user);
    if (!adherent) return;
    const membres = palanquee.composers || [];
    const estMembre = membres.some((c) => c.num_adherent === adherent.num_adherent);
    if (!estMembre) throw new Error('Accès refusé à cette palanquée');
  }

  async getByPlongee(id_plongee, user = null, authHeader = null) {
    const results = await this.palanqueeRepository.findByPlongee(id_plongee);
    const filtered = await this.filterForAdherent(results, user);
    return await this.enrichComposers(filtered, authHeader);
  }

  async getBySortie(id_sortie, user = null, authHeader = null) {
    const results = await this.palanqueeRepository.findBySortie(id_sortie);
    const filtered = await this.filterForAdherent(results, user);
    return await this.enrichComposers(filtered, authHeader);
  }

  async getByMoniteur(id_moniteur, authHeader = null) {
    const results = await this.palanqueeRepository.findByMoniteur(id_moniteur);
    return await this.enrichComposers(results, authHeader);
  }

  async filterForAdherent(results, user) {
    const adherent = await identiteClient.getAdherentForUser(user);
    if (!adherent) return results;
    return results.filter((p) =>
      (p.composers || []).some((c) => c.num_adherent === adherent.num_adherent),
    );
  }

  assertStaff(user) {
    if (!isStaff(user?.role)) {
      throw new Error('Seul un moniteur ou le président peut gérer les palanquées');
    }
  }

  async create(data, user = null) {
    this.assertStaff(user);
    if (!data.id_sortie) throw new Error('La sortie est requise');
    if (!data.nom_palanquee) throw new Error('Le nom de la palanquée est requis');

    return await this.palanqueeRepository.create({
      id_sortie: data.id_sortie,
      id_plongee: data.id_plongee || null,
      nom_palanquee: data.nom_palanquee,
      id_moniteur_encadrant: data.id_moniteur_encadrant || null,
    });
  }

  // ✅ Calcule le nombre max de plongeurs pour un groupe encadré par 1 moniteur :
  // 1/4 si un membre est Débutant ou Niveau 1, 1/6 sinon (règle FFESSM simplifiée)
  computeMaxRatio(niveaux) {
    const aUnNiveauLimitant = niveaux.some((n) => NIVEAUX_LIMITANTS.includes(n));
    return aUnNiveauLimitant ? 4 : 6;
  }

  async assertPalanqueeModifiable(palanquee) {
    if (palanquee.statut === 'Terminée') {
      throw new Error('Cette palanquée est clôturée, elle ne peut plus être modifiée');
    }
  }

  async addMembre(id_palanquee, num_adherent, user = null, authHeader = null) {
    this.assertStaff(user);

    const palanquee = await this.palanqueeRepository.findByIdDetailed(id_palanquee);
    if (!palanquee) throw new Error('Palanquée non trouvée');
    await this.assertPalanqueeModifiable(palanquee);

    const dejaMembre = (palanquee.composers || []).some(
      (c) => c.num_adherent === num_adherent,
    );
    if (dejaMembre) throw new Error('Cet adhérent est déjà membre de la palanquée');

    const nouvelAdherent = await identiteClient.getAdherentById(num_adherent, authHeader);
    if (!nouvelAdherent) throw new Error('Adhérent non trouvé');

    // Adherent (identite-service) a quitté ce schéma : niveaux des membres
    // actuels recomposés via identiteClient avant de calculer le ratio.
    const composersAvecAdherent = await withAdherent(palanquee.composers || [], { authHeader });
    const niveauxActuels = composersAvecAdherent.map((c) => c.adherent?.niveau);
    const maxRatio = this.computeMaxRatio([...niveauxActuels, nouvelAdherent.niveau]);
    if ((palanquee.composers || []).length + 1 > maxRatio) {
      throw new Error(
        `Ratio encadrant/plongeur dépassé : maximum ${maxRatio} plongeurs pour cette composition de niveaux`,
      );
    }

    return await Composer.create({ id_palanquee, num_adherent });
  }

  async removeMembre(id_palanquee, num_adherent, user = null) {
    this.assertStaff(user);

    const palanquee = await this.palanqueeRepository.findByIdDetailed(id_palanquee);
    if (!palanquee) throw new Error('Palanquée non trouvée');
    await this.assertPalanqueeModifiable(palanquee);

    const composition = await Composer.findOne({ where: { id_palanquee, num_adherent } });
    if (!composition) throw new Error('Composition non trouvée');
    await composition.destroy();

    if (palanquee.id_guide_palanquee === num_adherent) {
      palanquee.id_guide_palanquee = null;
      await palanquee.save();
    }
    if (palanquee.id_secouriste === num_adherent) {
      palanquee.id_secouriste = null;
      await palanquee.save();
    }

    return true;
  }

  async updateEncadrement(id_palanquee, { id_guide_palanquee, id_secouriste }, user = null) {
    this.assertStaff(user);

    const palanquee = await this.palanqueeRepository.findByIdDetailed(id_palanquee);
    if (!palanquee) throw new Error('Palanquée non trouvée');
    await this.assertPalanqueeModifiable(palanquee);

    const membreIds = (palanquee.composers || []).map((c) => c.num_adherent);
    if (id_guide_palanquee && !membreIds.includes(id_guide_palanquee)) {
      throw new Error('Le guide de palanquée doit être un membre de la palanquée');
    }
    if (id_secouriste && !membreIds.includes(id_secouriste)) {
      throw new Error('Le secouriste doit être un membre de la palanquée');
    }

    palanquee.id_guide_palanquee = id_guide_palanquee || null;
    palanquee.id_secouriste = id_secouriste || null;
    await palanquee.save();

    return palanquee;
  }

  // ✅ Étapes 3-4 : saisie des données de plongée + génération/màj du carnet
  // individuel de chaque membre de la palanquée (idempotent)
  async enregistrerDonneesPlongee(id_palanquee, data, user = null) {
    this.assertStaff(user);

    const palanquee = await this.palanqueeRepository.findByIdDetailed(id_palanquee);
    if (!palanquee) throw new Error('Palanquée non trouvée');
    await this.assertPalanqueeModifiable(palanquee);

    const membres = palanquee.composers || [];
    if (membres.length === 0) {
      throw new Error('Impossible de saisir des données pour une palanquée sans membre');
    }

    const sortie = await Sortie.findByPk(palanquee.id_sortie);
    if (!sortie) throw new Error('Sortie associée introuvable');

    palanquee.profondeur_max_realisee = data.profondeur_max_realisee ?? palanquee.profondeur_max_realisee;
    palanquee.duree_reelle = data.duree_reelle ?? palanquee.duree_reelle;
    await palanquee.save();

    const observationsParMembre = data.observationsParMembre || {};
    const communData = {
      date: data.date || sortie.date_heure,
      profondeur_max: data.profondeur_max_realisee,
      duree: data.duree_reelle,
      temperature_eau: data.temperature_eau ?? null,
      visibilite: data.visibilite || null,
      type_plongee: data.type_plongee || sortie.type,
      observations_faune: data.observations_faune || null,
    };

    const plongees = [];
    for (const composition of membres) {
      const existante = await Plongee.findOne({
        where: { id_palanquee, num_adherent: composition.num_adherent },
      });

      const observations_moniteur = observationsParMembre[composition.num_adherent] || null;

      if (existante) {
        await existante.update({ ...communData, observations_moniteur });
        plongees.push(existante);
      } else {
        const creee = await Plongee.create({
          ...communData,
          num_adherent: composition.num_adherent,
          id_sortie: palanquee.id_sortie,
          id_palanquee,
          observations_moniteur,
        });
        plongees.push(creee);
      }
    }

    return { palanquee, plongees };
  }

  // ✅ Étape 5 : retour du matériel attribué à la palanquée (création auto
  // d'une demande de réparation si détérioration signalée)
  async retournerMateriel(id_palanquee, retours = [], user = null, authHeader = null) {
    this.assertStaff(user);

    const palanquee = await this.palanqueeRepository.findByIdDetailed(id_palanquee);
    if (!palanquee) throw new Error('Palanquée non trouvée');

    const AttributionService = require('./AttributionService');
    const attributionService = new AttributionService();

    const resultats = [];
    for (const retour of retours) {
      const attribution = await attributionService.getById(retour.id_attribution);
      if (!attribution || attribution.id_palanquee !== id_palanquee) {
        throw new Error("Attribution introuvable pour cette palanquée");
      }

      const updated = await attributionService.retourner(retour.id_attribution, {
        etat_retour: retour.etat_retour,
        date_retour_reel: new Date(),
      });

      if (retour.constat_deterioration) {
        updated.constat_deterioration = retour.constat_deterioration;
        await updated.save();
      }

      if (['À réparer', 'Hors service'].includes(retour.etat_retour)) {
        await materielClient.createReparation({
          num_inventaire: attribution.num_inventaire,
          date_constat: new Date(),
          description_panne:
            retour.constat_deterioration || 'Détérioration signalée au retour de sortie',
          prestataire: 'À déterminer',
          cout: 0,
          statut: 'En cours',
        }, authHeader);
      }

      resultats.push(updated);
    }

    return resultats;
  }

  async cloturer(id_palanquee, user = null) {
    this.assertStaff(user);

    const palanquee = await this.palanqueeRepository.findByIdDetailed(id_palanquee);
    if (!palanquee) throw new Error('Palanquée non trouvée');
    if (palanquee.statut === 'Terminée') return palanquee;

    palanquee.statut = 'Terminée';
    palanquee.date_cloture = new Date();
    await palanquee.save();

    return palanquee;
  }

  async getStatsBySortie(id_sortie) {
    const palanquees = await this.palanqueeRepository.findBySortie(id_sortie);
    const total = palanquees.length;
    const totalPlongeurs = palanquees.reduce(
      (sum, p) => sum + (p.composers || []).length,
      0,
    );
    return {
      nb_palanquees: total,
      nb_plongeurs: totalPlongeurs,
      ratio_moyen: total > 0 ? Math.round((totalPlongeurs / total) * 10) / 10 : 0,
    };
  }

  async validatePalanqueeData(data) {
    const errors = [];

    if (!data.id_sortie) errors.push("La sortie est requise");
    if (!data.nom_palanquee) errors.push("Le nom de la palanquée est requis");

    return errors;
  }
}

module.exports = PalanqueeService;
