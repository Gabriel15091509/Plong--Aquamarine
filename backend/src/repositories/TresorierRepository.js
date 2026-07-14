const BaseRepository = require('./BaseRepository');
const { Tresorier } = require('../models');

class TresorierRepository extends BaseRepository {
  constructor() {
    super(Tresorier);
  }

  async findByUserId(user_id) {
    return await this.model.findOne({ where: { user_id } });
  }

  async findByAnnee(annee) {
    return await this.model.findOne({ where: { annee_en_poste: annee } });
  }
}

module.exports = TresorierRepository;
