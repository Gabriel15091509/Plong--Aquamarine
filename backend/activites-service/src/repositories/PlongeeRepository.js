const BaseRepository = require('./BaseRepository');
const { Plongee, Palanquee, Composer } = require('../models');
const { Op } = require('sequelize');

// Adherent (identite-service) a quitté ce schéma : plus d'include imbriqué
// sur Composer.adherent ici — voir PlongeeService qui recompose via
// identiteClient après cet appel.
const WITH_PALANQUEE = [
  {
    model: Palanquee,
    as: 'palanquee',
    include: [
      {
        model: Composer,
        as: 'composers',
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

  async countInPeriod(dateField, start, end) {
    return await this.model.count({
      where: { [dateField]: { [Op.gte]: start, [Op.lte]: end } },
    });
  }
}

module.exports = PlongeeRepository;
