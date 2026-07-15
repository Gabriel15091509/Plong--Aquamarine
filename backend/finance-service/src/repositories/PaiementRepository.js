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

  async findLatestByReference(type_paiement, reference_id) {
    return await this.model.findOne({
      where: { type_paiement, reference_id: String(reference_id) },
      order: [['created_at', 'DESC']]
    });
  }

  // Anti-doublon : détecte un paiement identique (même adhérent, type,
  // référence et montant) créé il y a moins de `windowMs` — un double-clic
  // ou une double soumission envoie deux requêtes quasi simultanées avant
  // qu'un garde-fou front-end ne puisse les bloquer, ce qui insérait deux
  // lignes distinctes pour un seul paiement reçu.
  async findRecentDuplicate({ num_adherent, type_paiement, reference_id, montant }, windowMs = 10000) {
    return await this.model.findOne({
      where: {
        num_adherent,
        type_paiement,
        reference_id: reference_id !== undefined && reference_id !== null ? String(reference_id) : null,
        montant,
        created_at: { [Op.gte]: new Date(Date.now() - windowMs) },
      },
      order: [['created_at', 'DESC']],
    });
  }

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
        statut: 'Payé'
      }
    });
    return result ? result.get('total') || 0 : 0;
  }

  // Utilisé par le trend du dashboard (monolithe) via HTTP — même logique
  // que DashboardService.sumTrend(Paiement, "date_paiement", "montant", {
  // statut: "Payé" }) avant le découpage.
  async sumInPeriod(dateField, valueField, where, start, end) {
    const result = await this.model.findOne({
      attributes: [[this.model.sequelize.fn('SUM', this.model.sequelize.col(valueField)), 'total']],
      where: { ...where, [dateField]: { [Op.gte]: start, [Op.lte]: end } },
      raw: true,
    });
    return Number(result?.total) || 0;
  }
}

module.exports = PaiementRepository;
