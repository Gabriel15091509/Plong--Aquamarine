const BaseService = require('./BaseService');
const AdhesionRepository = require('../repositories/AdhesionRepository');

class AdhesionService extends BaseService {
  constructor() {
    const repository = new AdhesionRepository();
    super(repository);
    this.adhesionRepository = repository;
  }

  async getActiveAdhesions() {
    return await this.adhesionRepository.findActiveAdhesions();
  }

  async getExpiringAdhesions(days = 30) {
    return await this.adhesionRepository.findExpiringAdhesions(days);
  }

  async getAdhesionsByAdherent(num_adherent) {
    return await this.adhesionRepository.findByAdherent(num_adherent);
  }

  async getAdhesionStats() {
    return await this.adhesionRepository.getAdhesionStats();
  }

  async validateAdhesionData(data) {
    const errors = [];
    
    if (!data.num_adherent) errors.push('L\'adhérent est requis');
    if (!data.type) errors.push('Le type d\'adhésion est requis');
    if (!data.date_debut) errors.push('La date de début est requise');
    if (!data.date_fin) errors.push('La date de fin est requise');
    if (!data.montant_paye || data.montant_paye <= 0) {
      errors.push('Le montant doit être supérieur à 0');
    }
    if (!data.annee_adhesion) errors.push('L\'année d\'adhésion est requise');
    
    if (data.date_debut && data.date_fin) {
      const debut = new Date(data.date_debut);
      const fin = new Date(data.date_fin);
      if (fin <= debut) {
        errors.push('La date de fin doit être postérieure à la date de début');
      }
    }
    
    return errors;
  }
}

module.exports = AdhesionService;