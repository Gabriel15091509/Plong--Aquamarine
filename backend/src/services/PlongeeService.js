const BaseService = require('./BaseService');
const PlongeeRepository = require('../repositories/PlongeeRepository');

class PlongeeService extends BaseService {
  constructor() {
    const repository = new PlongeeRepository();
    super(repository);
    this.plongeeRepository = repository;
  }

  async getPlongeesByAdherent(num_adherent) {
    return await this.plongeeRepository.findPlongeesByAdherent(num_adherent);
  }

  async getPlongeeWithDetails(id) {
    return await this.plongeeRepository.findPlongeesWithDetails(id);
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

  async validatePlongee(id) {
    const plongee = await this.getById(id);
    if (!plongee) throw new Error('Plongée non trouvée');
    
    plongee.valide_moniteur = true;
    await plongee.save();
    
    const AdherentService = require('./AdherentService');
    const adherentService = new AdherentService();
    await adherentService.incrementPlongeesCount(plongee.num_adherent);
    
    return plongee;
  }
}

module.exports = PlongeeService;