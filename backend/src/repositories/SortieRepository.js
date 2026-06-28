const BaseRepository = require('./BaseRepository');
const { Sortie, Inscription } = require('../models');
const { Op } = require('sequelize');

class SortieRepository extends BaseRepository {
  constructor() {
    super(Sortie);
  }

  async findUpcomingSorties() {
    const today = new Date();
    return await this.model.findAll({
      where: {
        date_heure: { [Op.gte]: today },
        statut: ['Planifiée', 'En cours']
      },
      order: [['date_heure', 'ASC']]
    });
  }

  async findSortiesWithInscriptions() {
    return await this.model.findAll({
      include: [{
        model: Inscription,
        as: 'inscriptions'
      }],
      order: [['date_heure', 'ASC']]
    });
  }

  // ✅ Ajout de getStats
  async getStats() {
    const stats = await this.model.findAll({
      attributes: [
        'statut',
        [this.model.sequelize.fn('COUNT', this.model.sequelize.col('id_sortie')), 'count']
      ],
      group: ['statut']
    });
    return stats;
  }

  async findAvailablePlaces() {
    const sorties = await this.model.findAll({
      where: {
        statut: ['Planifiée', 'En cours'],
        date_heure: { [Op.gte]: new Date() }
      },
      include: [{
        model: Inscription,
        as: 'inscriptions',
        where: { statut: 'Confirmée' },
        required: false
      }]
    });

    return sorties.map(sortie => {
      const confirmedCount = sortie.inscriptions ? sortie.inscriptions.length : 0;
      return {
        ...sortie.toJSON(),
        places_disponibles: sortie.nb_places - confirmedCount
      };
    });
  }
}

module.exports = SortieRepository;