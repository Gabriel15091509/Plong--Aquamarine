const BaseRepository = require('./BaseRepository');
const { Plongee, Palanquee, Composer } = require('../models');
const { Op } = require('sequelize');

class PlongeeRepository extends BaseRepository {
  constructor() {
    super(Plongee);
  }

  async findPlongeesByAdherent(num_adherent) {
    return await this.model.findAll({
      where: { num_adherent },
      order: [['date', 'DESC']]
    });
  }

  async findPlongeesWithDetails(id) {
    return await this.model.findByPk(id, {
      include: [
        {
          model: Palanquee,
          as: 'palanquees',
          include: [{
            model: Composer,
            as: 'compositions'
          }]
        }
      ]
    });
  }

  // ✅ Ajout de getStats
  async getStats() {
    const stats = await this.model.findAll({
      attributes: [
        'type_plongee',
        [this.model.sequelize.fn('COUNT', this.model.sequelize.col('id_plongee')), 'count'],
        [this.model.sequelize.fn('AVG', this.model.sequelize.col('profondeur_max')), 'avg_depth']
      ],
      group: ['type_plongee']
    });
    return stats;
  }

  async getPlongeesByDateRange(startDate, endDate) {
    return await this.model.findAll({
      where: {
        date: {
          [Op.between]: [startDate, endDate]
        }
      },
      order: [['date', 'DESC']]
    });
  }
}

module.exports = PlongeeRepository;