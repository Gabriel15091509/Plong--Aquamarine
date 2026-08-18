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

  // Check-list de départ/retour du matériel pour une sortie (CDC 3.4.3).
  async findBySortie(id_sortie) {
    return await this.model.findAll({
      where: { id_sortie },
      order: [['date_attribution', 'ASC']],
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

  // Matériel attribué à cet adhérent pour cette sortie précise — sert à
  // afficher "matériel utilisé" sur une plongée du carnet (CDC 3.3.1) sans
  // ajouter de FK id_plongee sur Attribution : num_adherent + id_sortie
  // identifie déjà sans ambiguïté l'attribution correspondante (Attribution
  // vit dans ce même service/schéma que Plongee, contrairement à Materiel).
  async findByAdherentAndSortie(num_adherent, id_sortie) {
    if (!id_sortie) return [];
    return await this.model.findAll({
      where: { num_adherent, id_sortie },
      order: [['date_attribution', 'ASC']],
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
