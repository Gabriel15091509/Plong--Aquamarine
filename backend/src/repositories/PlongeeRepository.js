const BaseRepository = require('./BaseRepository');
const { Plongee, Palanquee, Composer, Adherent } = require('../models');
const { Op } = require('sequelize');

const WITH_PALANQUEE = [
  {
    model: Palanquee,
    as: 'palanquee',
    include: [
      {
        model: Composer,
        as: 'composers',
        include: [{ model: Adherent, as: 'adherent' }],
      },
    ],
  },
];

class PlongeeRepository extends BaseRepository {
  constructor() {
    super(Plongee);
  }

  async findById(id) {
    return await this.model.findByPk(id, { include: WITH_PALANQUEE });
  }

  async findPlongeesByAdherent(num_adherent) {
    return await this.model.findAll({
      where: { num_adherent },
      order: [['date', 'DESC']]
    });
  }

  async findPlongeesWithDetails(id) {
    return await this.model.findByPk(id, { include: WITH_PALANQUEE });
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