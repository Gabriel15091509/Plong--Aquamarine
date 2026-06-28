const BaseRepository = require('./BaseRepository');
const { Inscription } = require('../models');
const { Op } = require('sequelize');

class InscriptionRepository extends BaseRepository {
  constructor() {
    super(Inscription);
  }

  async findConfirmationsBySortie(id_sortie) {
    return await this.model.findAll({
      where: {
        id_sortie,
        statut: 'Confirmée'
      }
    });
  }

  async findByAdherentAndSortie(num_adherent, id_sortie) {
    return await this.model.findOne({
      where: {
        num_adherent,
        id_sortie
      }
    });
  }

  async getWaitlistBySortie(id_sortie) {
    return await this.model.findAll({
      where: {
        id_sortie,
        statut: "Liste d'attente"
      },
      order: [['rang_liste_attente', 'ASC']]
    });
  }

  async getInscriptionStats() {
    const stats = await this.model.findAll({
      attributes: [
        'statut',
        [this.model.sequelize.fn('COUNT', this.model.sequelize.col('id_inscription')), 'count']
      ],
      group: ['statut']
    });
    return stats;
  }
}

module.exports = InscriptionRepository;