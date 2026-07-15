const BaseRepository = require('./BaseRepository');
const { Competence } = require('../models');

class CompetenceRepository extends BaseRepository {
  constructor() {
    super(Competence);
  }

  async findByFormation(id_formation) {
    return await this.model.findAll({
      where: { id_formation }
    });
  }
}

module.exports = CompetenceRepository;
