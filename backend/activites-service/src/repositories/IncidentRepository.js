const BaseRepository = require('./BaseRepository');
const { Incident } = require('../models');

class IncidentRepository extends BaseRepository {
  constructor() {
    super(Incident);
  }

  async findBySortie(id_sortie) {
    return await this.model.findAll({
      where: { id_sortie },
      order: [['created_at', 'DESC']]
    });
  }

  async findNonClotures() {
    return await this.model.findAll({
      where: { cloture: false },
      order: [['created_at', 'DESC']]
    });
  }
}

module.exports = IncidentRepository;
