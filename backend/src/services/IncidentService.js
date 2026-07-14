const BaseService = require('./BaseService');
const IncidentRepository = require('../repositories/IncidentRepository');

class IncidentService extends BaseService {
  constructor() {
    const repository = new IncidentRepository();
    super(repository);
    this.incidentRepository = repository;
  }

  async getBySortie(id_sortie) {
    return await this.incidentRepository.findBySortie(id_sortie);
  }

  async getNonClotures() {
    return await this.incidentRepository.findNonClotures();
  }

  async cloturer(id, mesures_prises) {
    const data = {
      cloture: true,
      date_cloture: new Date()
    };
    if (mesures_prises) data.mesures_prises = mesures_prises;

    return await this.incidentRepository.update(id, data);
  }

  async validateIncidentData(data) {
    const errors = [];

    if (!data.id_sortie) errors.push('La sortie est requise');
    if (!data.type) errors.push('Le type d\'incident est requis');
    if (!data.description) errors.push('La description est requise');

    return errors;
  }
}

module.exports = IncidentService;
