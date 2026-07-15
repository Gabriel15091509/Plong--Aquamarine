const BaseService = require('./BaseService');
const CompetenceRepository = require('../repositories/CompetenceRepository');

class CompetenceService extends BaseService {
  constructor() {
    const repository = new CompetenceRepository();
    super(repository);
    this.competenceRepository = repository;
  }

  async getByFormation(id_formation) {
    return await this.competenceRepository.findByFormation(id_formation);
  }

  async valider(id, validee_par) {
    return await this.competenceRepository.update(id, {
      acquise: true,
      date_validation: new Date(),
      validee_par
    });
  }

  async validateCompetenceData(data) {
    const errors = [];

    if (!data.id_formation) errors.push("La formation est requise");
    if (!data.libelle) errors.push("Le libellé est requis");
    if (!data.niveau_requis) errors.push("Le niveau requis est requis");

    return errors;
  }
}

module.exports = CompetenceService;
