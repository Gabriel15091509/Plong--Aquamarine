const BaseService = require("./BaseService");
const MaterielRepository = require("../repositories/MaterielRepository");
const ReparationRepository = require("../repositories/ReparationRepository");

// États "en bon état" au sens de ETAT_MATERIEL_OPTIONS côté frontend — un
// matériel ne peut pas y revenir tant qu'une réparation est en cours pour
// lui (voir assertPasDeReparationActive).
const ETATS_BON = ["Neuf", "Bon"];

class MaterielService extends BaseService {
  constructor() {
    const repository = new MaterielRepository();
    super(repository);
    this.materielRepository = repository;
    this.reparationRepository = new ReparationRepository();
  }

  async getAvailableMateriel() {
    return await this.materielRepository.findAvailableMateriel();
  }

  async getMaterielNeedingMaintenance() {
    return await this.materielRepository.findMaterielNeedingMaintenance();
  }

  async getMaterielWithReparations() {
    return await this.materielRepository.findMaterielWithReparations();
  }

  async getMaterielStats() {
    return await this.materielRepository.getStats();
  }

  // Même calcul que DashboardService.countTrend dans le monolithe — dupliqué
  // ici (voir FormationService.getTrend pour le motif d'origine), exposé via
  // `GET /materiels/trend` pour que le dashboard du monolithe le récupère par
  // HTTP au lieu d'une requête Sequelize directe sur un modèle qu'il n'a plus.
  async getTrend() {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastPeriod = new Date(startOfLastMonth);
    endOfLastPeriod.setDate(startOfLastMonth.getDate() + now.getDate());

    const [current, previous] = await Promise.all([
      this.materielRepository.countInPeriod("date_achat", startOfThisMonth, now),
      this.materielRepository.countInPeriod("date_achat", startOfLastMonth, endOfLastPeriod),
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

  async validateMaterielData(data) {
    const errors = [];

    if (!data.num_inventaire) errors.push('Le numéro d\'inventaire est requis');
    if (!data.categorie) errors.push('La catégorie est requise');
    if (!data.marque) errors.push('La marque est requise');
    if (!data.modele) errors.push('Le modèle est requis');
    if (!data.date_achat) errors.push('La date d\'achat est requise');
    if (!data.localisation) errors.push('La localisation est requise');

    // Attributs propres à certaines catégories (voir CATEGORIE_MATERIEL_OPTIONS
    // côté frontend) — les autres catégories n'ont pas de champ obligatoire
    // supplémentaire au-delà des champs génériques ci-dessus.
    if (data.categorie === 'Bloc' && !data.capacite) {
      errors.push("La capacité est requise pour un bloc d'air");
    }
    if (data.categorie === 'Stabilisateur' && !data.etat_sangles) {
      errors.push("L'état des sangles est requis pour un stabilisateur");
    }
    if (data.categorie === 'Ordinateur' && !data.batterie) {
      errors.push("L'état de la batterie est requis pour un ordinateur de plongée");
    }

    return errors;
  }

  // Un matériel dont la réparation est encore "En cours" ne peut pas être
  // remis "Bon"/"Neuf" ni "Local" par un autre chemin que la fin de cette
  // réparation (ReparationService.terminer, qui écrit directement via le
  // modèle Materiel et ne repasse donc pas par ce garde-fou) — sinon rien
  // n'empêchait de déclarer un matériel "Bon" pendant qu'il est
  // physiquement à l'atelier, l'incohérence signalée : un matériel ne peut
  // pas être à la fois "Bon" et "en réparation".
  async assertPasDeReparationActive(num_inventaire) {
    const reparationActive = await this.reparationRepository.findActiveByMateriel(num_inventaire);
    if (reparationActive) {
      throw new Error(
        `Impossible : une réparation est en cours pour ce matériel depuis le ${new Date(
          reparationActive.date_constat,
        ).toLocaleDateString('fr-FR')} — terminez-la d'abord (voir Réparations).`,
      );
    }
  }

  // Surcharge de BaseService.update : le formulaire de fiche matériel
  // renvoie systématiquement l'objet complet (tous les champs toujours
  // présents), donc comparer au stock actuel avant de déclencher le
  // garde-fou — sinon un simple ré-enregistrement d'un matériel déjà
  // incohérent (état hérité d'avant ce correctif) bloquerait n'importe
  // quelle modification sans rapport, même motif que SortieService.update
  // (voir valeurChampModifiee côté activites-service).
  async update(num_inventaire, data) {
    const materiel = await this.getById(num_inventaire);
    if (materiel) {
      const etatDevientBon =
        data.etat !== undefined && data.etat !== materiel.etat && ETATS_BON.includes(data.etat);
      const localisationDevientLocal =
        data.localisation !== undefined &&
        data.localisation !== materiel.localisation &&
        data.localisation === 'Local';
      if (etatDevientBon || localisationDevientLocal) {
        await this.assertPasDeReparationActive(num_inventaire);
      }
    }
    return await super.update(num_inventaire, data);
  }

  async updateEtat(num_inventaire, etat) {
    const materiel = await this.getById(num_inventaire);
    if (!materiel) throw new Error('Matériel non trouvé');

    if (ETATS_BON.includes(etat)) {
      await this.assertPasDeReparationActive(num_inventaire);
    }

    materiel.etat = etat;
    await materiel.save();

    return materiel;
  }

  // Appelé par AttributionService (activites-service, via HTTP) au prêt/
  // retour d'un matériel, et en interne par ReparationService à l'entrée/
  // sortie d'atelier — reflète où se trouve réellement la pièce (voir
  // LOCALISATION_MATERIEL_OPTIONS côté frontend : Local/Prêté/En réparation).
  async updateLocalisation(num_inventaire, localisation) {
    const materiel = await this.getById(num_inventaire);
    if (!materiel) throw new Error('Matériel non trouvé');

    if (localisation === 'Local') {
      await this.assertPasDeReparationActive(num_inventaire);
    }

    materiel.localisation = localisation;
    await materiel.save();

    return materiel;
  }

  async updatePhoto(num_inventaire, photo_path) {
    const materiel = await this.getById(num_inventaire);
    if (!materiel) throw new Error('Matériel non trouvé');

    materiel.photo_path = photo_path;
    await materiel.save();

    return materiel;
  }

  async checkAvailability(num_inventaire) {
    const materiel = await this.getById(num_inventaire);
    if (!materiel) return false;

    const bonEtat = materiel.etat === 'Bon' || materiel.etat === 'Neuf';
    // Sans ce test, un matériel envoyé en réparation (localisation mise à
    // jour par ReparationService.create) mais dont l'état général `etat`
    // n'a pas encore été dégradé restait "disponible" ici — et donc
    // attribuable — alors qu'il est physiquement à l'atelier.
    const disponibleAuClub = materiel.localisation === 'Local';
    const echeanceDepassee =
      materiel.date_prochaine_echeance && new Date(materiel.date_prochaine_echeance) < new Date();

    return bonEtat && disponibleAuClub && !echeanceDepassee;
  }
}

module.exports = MaterielService;
