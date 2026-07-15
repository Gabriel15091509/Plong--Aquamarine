const BaseRepository = require('./BaseRepository');
const { Alerte } = require('../models');
const { NotFoundError } = require('../utils/errors');

class AlerteRepository extends BaseRepository {
  constructor() {
    super(Alerte);
  }

  async findUnread(where = {}) {
    return await this.model.findAll({
      where: { ...where, read: false },
      order: [['date_envoi', 'DESC']]
    });
  }

  async findByAdherent(num_adherent) {
    return await this.model.findAll({
      where: { num_adherent },
      order: [['date_envoi', 'DESC']]
    });
  }

  async markAsRead(id, where = {}) {
    const alerte = await this.findById(id);
    if (!alerte) throw new NotFoundError('Alerte not found');
    for (const [key, value] of Object.entries(where)) {
      if (alerte[key] !== value) throw new NotFoundError('Alerte not found');
    }
    alerte.read = true;
    alerte.statut = 'Lu';
    await alerte.save();
    return alerte;
  }

  async markAllAsRead(where = {}) {
    const result = await this.model.update(
      { read: true, statut: 'Lu' },
      { where: { ...where, read: false } }
    );
    return result;
  }

  async getStats(where = {}) {
    const stats = await this.model.findAll({
      where,
      attributes: [
        'type',
        'statut',
        [this.model.sequelize.fn('COUNT', this.model.sequelize.col('id_alerte')), 'count']
      ],
      group: ['type', 'statut']
    });
    return stats;
  }

  async getUnreadCount(where = {}) {
    return await this.model.count({
      where: { ...where, read: false }
    });
  }
}

module.exports = AlerteRepository;
