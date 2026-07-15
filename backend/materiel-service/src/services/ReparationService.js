const BaseService = require('./BaseService');
const ReparationRepository = require('../repositories/ReparationRepository');

class ReparationService extends BaseService {
  constructor() {
    const repository = new ReparationRepository();
    super(repository);
    this.reparationRepository = repository;
  }

  async getByMateriel(num_inventaire) {
    return await this.reparationRepository.findByMateriel(num_inventaire);
  }

  async getEnCours() {
    return await this.reparationRepository.findEnCours();
  }

  async terminer(id, date_retour) {
    return await this.reparationRepository.update(id, {
      statut: 'Terminée',
      date_retour
    });
  }

  async validateReparationData(data) {
    const errors = [];

    if (!data.num_inventaire) errors.push("Le matériel est requis");
    if (!data.date_constat) errors.push("La date de constat est requise");
    if (!data.description_panne) errors.push("La description de la panne est requise");
    if (!data.prestataire) errors.push("Le prestataire est requis");
    if (data.cout === undefined || data.cout === null || data.cout < 0) {
      errors.push("Le coût est requis et doit être positif");
    }

    return errors;
  }
}

module.exports = ReparationService;
