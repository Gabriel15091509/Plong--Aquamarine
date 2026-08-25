const BaseRepository = require('./BaseRepository');
const { Alerte } = require('../models');
const { NotFoundError } = require('../utils/errors');

class AlerteRepository extends BaseRepository {
  constructor() {
    super(Alerte);
  }

  // `limit` optionnel : le dropdown de notifications (Header.jsx) n'a
  // besoin que des toutes dernières alertes non lues, pas de l'historique
  // complet — sans lui, un club avec beaucoup d'adhérents/alertes finissait
  // par charger (et faire tenir en mémoire côté navigateur) des centaines
  // de lignes à chaque ouverture du dropdown.
  async findUnread(where = {}, { limit } = {}) {
    return await this.model.findAll({
      where: { ...where, read: false },
      order: [['date_envoi', 'DESC']],
      ...(limit ? { limit } : {}),
    });
  }

  // Pagination réelle (offset/limit + total via findAndCountAll) pour la
  // page "Toutes les notifications" — voir AlerteService.getAllPaginated.
  async findAllPaginated(where = {}, { limit = 20, offset = 0 } = {}) {
    return await this.model.findAndCountAll({
      where,
      order: [['date_envoi', 'DESC']],
      limit,
      offset,
    });
  }

  async findByAdherent(num_adherent) {
    return await this.model.findAll({
      where: { num_adherent },
      order: [['date_envoi', 'DESC']]
    });
  }

  async markAsRead(id, where = {}) {
    // Passe par une vraie clause Sequelize (findOne) plutôt qu'une
    // comparaison manuelle champ-à-champ : `where` peut désormais contenir
    // un opérateur (ex. `{ type: { [Op.in]: [...] } }` pour le périmètre
    // trésorier/moniteur), qu'une simple égalité `alerte[key] !== value`
    // ne sait pas évaluer.
    const alerte = await this.model.findOne({ where: { id_alerte: id, ...where } });
    if (!alerte) throw new NotFoundError('Alerte not found');
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
