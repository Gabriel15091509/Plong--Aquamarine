const BaseRepository = require('./BaseRepository');
const { Reparation } = require('../models');

class ReparationRepository extends BaseRepository {
  constructor() {
    super(Reparation);
  }

  async findByMateriel(num_inventaire) {
    return await this.model.findAll({
      where: { num_inventaire },
      order: [['date_constat', 'DESC']]
    });
  }

  async findEnCours() {
    return await this.model.findAll({
      where: { statut: 'En cours' }
    });
  }
}

module.exports = ReparationRepository;
