const BaseRepository = require('./BaseRepository');
const { Paiement } = require('../models');
const { Op } = require('sequelize');

class PaiementRepository extends BaseRepository {
  constructor() {
    super(Paiement);
  }

  async findPendingPayments() {
    return await this.model.findAll({
      where: { statut: 'En attente' }
    });
  }

  async findByAdherent(num_adherent) {
    return await this.model.findAll({
      where: { num_adherent },
      order: [['date_paiement', 'DESC']]
    });
  }

  // ✅ Ajout de getStats
  async getStats() {
    const stats = await this.model.findAll({
      attributes: [
        'statut',
        [this.model.sequelize.fn('COUNT', this.model.sequelize.col('id_paiement')), 'count'],
        [this.model.sequelize.fn('SUM', this.model.sequelize.col('montant')), 'total']
      ],
      group: ['statut']
    });
    return stats;
  }

  async getTotalPaymentsByPeriod(startDate, endDate) {
    const result = await this.model.findOne({
      attributes: [
        [this.model.sequelize.fn('SUM', this.model.sequelize.col('montant')), 'total']
      ],
      where: {
        date_paiement: {
          [Op.between]: [startDate, endDate]
        },
        statut: 'Validé'
      }
    });
    return result ? result.get('total') || 0 : 0;
  }
}

module.exports = PaiementRepository;