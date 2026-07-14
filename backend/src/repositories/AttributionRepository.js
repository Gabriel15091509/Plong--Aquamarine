const BaseRepository = require('./BaseRepository');
const { Attribution } = require('../models');

class AttributionRepository extends BaseRepository {
  constructor() {
    super(Attribution);
  }

  async findByAdherent(num_adherent) {
    return await this.model.findAll({
      where: { num_adherent },
      order: [['date_attribution', 'DESC']]
    });
  }

  async findByMateriel(num_inventaire) {
    return await this.model.findAll({
      where: { num_inventaire },
      order: [['date_attribution', 'DESC']]
    });
  }

  async findEnCours() {
    return await this.model.findAll({
      where: { date_retour_reel: null }
    });
  }

  async findByPalanquee(id_palanquee) {
    const { Materiel, Adherent } = require('../models');
    return await this.model.findAll({
      where: { id_palanquee },
      include: [
        { model: Materiel, as: 'materiel' },
        { model: Adherent, as: 'adherent' },
      ],
      order: [['date_attribution', 'DESC']],
    });
  }
}

module.exports = AttributionRepository;
