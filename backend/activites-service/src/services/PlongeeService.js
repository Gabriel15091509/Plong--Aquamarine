const BaseService = require('./BaseService');
const PlongeeRepository = require('../repositories/PlongeeRepository');
const identiteClient = require('../utils/serviceClients/identiteClient');
const { withAdherent } = require('../utils/enrichAdherents');

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
  // identiteClient.
  async getPlongeeWithDetails(id, user = null, authHeader = null) {
    const plongee = await this.plongeeRepository.findPlongeesWithDetails(id);
    if (!plongee) return plongee;
    await this.assertCanAccessPlongee(plongee, user);

    const plain = plongee.toJSON();
    if (plain.palanquee?.composers?.length) {
      plain.palanquee.composers = await withAdherent(plain.palanquee.composers, { authHeader });
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

  // AdherentService (identite-service) : incrémentation du compte de
  // plongées de l'adhérent via HTTP au lieu d'un appel en-process.
  async validatePlongee(id, id_moniteur, authHeader = null) {
    const plongee = await this.getById(id);
    if (!plongee) throw new Error('Plongée non trouvée');
    if (!id_moniteur) throw new Error('Le moniteur validateur est requis');

    plongee.id_moniteur_validateur = id_moniteur;
    await plongee.save();

    await identiteClient.incrementPlongeesCount(plongee.num_adherent, authHeader);

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
}

module.exports = PlongeeService;
