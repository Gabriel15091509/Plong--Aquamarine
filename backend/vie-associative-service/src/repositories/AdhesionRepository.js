const BaseRepository = require('./BaseRepository');
const { Adhesion } = require('../models');
const { Op } = require('sequelize');

class AdhesionRepository extends BaseRepository {
  constructor() {
    super(Adhesion);
  }

  async findActiveAdhesions() {
    const today = new Date();
    return await this.model.findAll({
      where: {
        date_debut: { [Op.lte]: today },
        date_fin: { [Op.gte]: today },
        statut_paiement: 'Payé'
      }
    });
  }

  async findExpiringAdhesions(days = 30) {
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + days);

    return await this.model.findAll({
      where: {
        date_fin: {
          [Op.between]: [today, futureDate]
        },
        statut_paiement: 'Payé'
      }
    });
  }

  async findByAdherent(num_adherent) {
    return await this.model.findAll({
      where: { num_adherent },
      order: [['date_debut', 'DESC']]
    });
  }

  async getAdhesionStats() {
    const stats = await this.model.findAll({
      attributes: [
        'type',
        [this.model.sequelize.fn('COUNT', this.model.sequelize.col('id_adhesion')), 'count'],
        [this.model.sequelize.fn('SUM', this.model.sequelize.col('montant')), 'total_amount']
      ],
      group: ['type']
    });
    return stats;
  }
}

module.exports = AdhesionRepository;
