const BaseRepository = require('./BaseRepository');
const { Plongee, Palanquee, Composer, Sortie } = require('../models');
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
      // Lieu/site affichés dans le carnet de plongée (PDF) et sa liste écran —
      // portés par Sortie, pas par Plongee elle-même.
      include: [{ model: Sortie, as: 'sortie', attributes: ['lieu', 'site'] }],
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

  // Un adhérent par ligne, avec la date de sa dernière plongée enregistrée —
  // ne couvre que les adhérents ayant déjà plongé au moins une fois (un
  // adhérent qui n'a jamais plongé n'a pas de "dernière plongée" à comparer).
  async findDerniereDatePlongeeParAdherent() {
    const rows = await this.model.findAll({
      attributes: [
        'num_adherent',
        [this.model.sequelize.fn('MAX', this.model.sequelize.col('date')), 'derniere_plongee'],
      ],
      group: ['num_adherent'],
      raw: true,
    });
    return rows;
  }
}

module.exports = PlongeeRepository;
