const BaseRepository = require('./BaseRepository');
const { Alerte } = require('../models');
const { Op } = require('sequelize');

class AlerteRepository extends BaseRepository {
  constructor() {
    super(Alerte);
  }

  async findUnread() {
    return await this.model.findAll({
      where: { read: false },
      order: [['date_envoi', 'DESC']]
    });
  }

  async findByAdherent(num_adherent) {
    return await this.model.findAll({
      where: { num_adherent },
      order: [['date_envoi', 'DESC']]
    });
  }

  async markAsRead(id) {
    const alerte = await this.findById(id);
    if (!alerte) throw new Error('Alerte not found');
    alerte.read = true;
    alerte.statut = 'Lu';
    await alerte.save();
    return alerte;
  }

  async markAllAsRead() {
    const result = await this.model.update(
      { read: true, statut: 'Lu' },
      { where: { read: false } }
    );
    return result;
  }

  async getStats() {
    const stats = await this.model.findAll({
      attributes: [
        'type',
        'statut',
        [this.model.sequelize.fn('COUNT', this.model.sequelize.col('id_alerte')), 'count']
      ],
      group: ['type', 'statut']
    });
    return stats;
  }

  async getUnreadCount() {
    return await this.model.count({
      where: { read: false }
    });
  }
}

module.exports = AlerteRepository;