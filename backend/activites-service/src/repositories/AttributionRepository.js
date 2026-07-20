const BaseRepository = require('./BaseRepository');
const { Attribution } = require('../models');
const { Op } = require('sequelize');

class AttributionRepository extends BaseRepository {
  constructor() {
    super(Attribution);
  }

  // Prêt/attribution non rendu alors que la date de retour prévue est passée.
  async findEnRetard() {
    return await this.model.findAll({
      where: {
        date_retour_reel: null,
        date_retour_prevue: { [Op.lt]: new Date() },
      },
    });
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

  // Prêt actif (non rendu) pour ce matériel, s'il existe — empêche
  // d'attribuer deux fois le même matériel avant son retour.
  async findActiveByMateriel(num_inventaire) {
    return await this.model.findOne({
      where: { num_inventaire, date_retour_reel: null },
    });
  }

  // Adherent (identite-service) a quitté ce schéma : plus d'include
  // Sequelize possible ici — voir AttributionService.getByPalanquee qui
  // recompose `.adherent` via identiteClient après cet appel.
  async findByPalanquee(id_palanquee) {
    return await this.model.findAll({
      where: { id_palanquee },
      order: [['date_attribution', 'DESC']],
    });
  }
}

module.exports = AttributionRepository;
