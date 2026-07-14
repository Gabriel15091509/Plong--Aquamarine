const BaseService = require('./BaseService');
const PlongeeRepository = require('../repositories/PlongeeRepository');
const { getAdherentForUser } = require('../utils/roleScope');

class PlongeeService extends BaseService {
  constructor() {
    const repository = new PlongeeRepository();
    super(repository);
    this.plongeeRepository = repository;
  }

  async getAll(user = null) {
    const adherent = await getAdherentForUser(user);
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
    const adherent = await getAdherentForUser(user);
    if (adherent && plongee.num_adherent !== adherent.num_adherent) {
      throw new Error("Accès refusé à cette plongée");
    }
  }

  async getPlongeesByAdherent(num_adherent, user = null) {
    const adherent = await getAdherentForUser(user);
    if (adherent && num_adherent !== adherent.num_adherent) {
      throw new Error("Accès refusé à ce carnet de plongée");
    }
    return await this.plongeeRepository.findPlongeesByAdherent(num_adherent);
  }

  async getPlongeeWithDetails(id, user = null) {
    const plongee = await this.plongeeRepository.findPlongeesWithDetails(id);
    if (plongee) await this.assertCanAccessPlongee(plongee, user);
    return plongee;
  }

  // ✅ Ajout de getPlongeeStats
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

  async validatePlongee(id, id_moniteur) {
    const plongee = await this.getById(id);
    if (!plongee) throw new Error('Plongée non trouvée');
    if (!id_moniteur) throw new Error('Le moniteur validateur est requis');

    plongee.id_moniteur_validateur = id_moniteur;
    await plongee.save();
    
    const AdherentService = require('./AdherentService');
    const adherentService = new AdherentService();
    await adherentService.incrementPlongeesCount(plongee.num_adherent);
    
    return plongee;
  }
}

module.exports = PlongeeService;