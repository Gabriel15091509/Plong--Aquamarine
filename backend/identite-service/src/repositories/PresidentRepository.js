const BaseRepository = require('./BaseRepository');
const { President } = require('../models');

class PresidentRepository extends BaseRepository {
  constructor() {
    super(President);
  }

  async findCurrent() {
    return await this.model.findOne({
      order: [['annee_en_poste', 'DESC']]
    });
  }

  async findByAnnee(annee) {
    return await this.model.findOne({ where: { annee_en_poste: annee } });
  }

  async findByMoniteurId(id_moniteur) {
    return await this.model.findOne({ where: { id_moniteur } });
  }
}

module.exports = PresidentRepository;
