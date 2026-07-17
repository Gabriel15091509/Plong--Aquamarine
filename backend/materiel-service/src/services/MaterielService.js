const BaseService = require("./BaseService");
const MaterielRepository = require("../repositories/MaterielRepository");

class MaterielService extends BaseService {
  constructor() {
    const repository = new MaterielRepository();
    super(repository);
    this.materielRepository = repository;
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

    return errors;
  }

  async updateEtat(num_inventaire, etat) {
    const materiel = await this.getById(num_inventaire);
    if (!materiel) throw new Error('Matériel non trouvé');

    materiel.etat = etat;
    await materiel.save();

    return materiel;
  }

  async checkAvailability(num_inventaire) {
    const materiel = await this.getById(num_inventaire);
    if (!materiel) return false;

    const bonEtat = materiel.etat === 'Bon' || materiel.etat === 'Neuf';
    const echeanceDepassee =
      materiel.date_prochaine_echeance && new Date(materiel.date_prochaine_echeance) < new Date();

    return bonEtat && !echeanceDepassee;
  }
}

module.exports = MaterielService;
