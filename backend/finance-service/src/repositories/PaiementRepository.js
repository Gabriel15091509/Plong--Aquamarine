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

  // "En retard" faute de date d'échéance dédiée sur Paiement : un paiement
  // encore "En attente" plus de `days` jours après sa création (date_paiement
  // vaut la date de création de l'enregistrement, pas une échéance future).
  async findEnRetard(days) {
    const seuil = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return await this.model.findAll({
      where: {
        statut: 'En attente',
        date_paiement: { [Op.lte]: seuil },
      },
    });
  }

  async findByAdherent(num_adherent) {
    return await this.model.findAll({
      where: { num_adherent },
      order: [['date_paiement', 'DESC']]
    });
  }

  // Tous les paiements (tout statut confondu, pas seulement 'Payé' comme
  // getTotalPaymentsByPeriod) dans une période — base de l'export CSV
  // mensuel du trésorier (CDC §8.3). Ordre chronologique croissant : c'est
  // l'ordre attendu d'un relevé.
  async findByPeriod(startDate, endDate) {
    return await this.model.findAll({
      where: { date_paiement: { [Op.between]: [startDate, endDate] } },
      order: [['date_paiement', 'ASC']],
    });
  }

  async findLatestByReference(type_paiement, reference_id) {
    return await this.model.findOne({
      where: { type_paiement, reference_id: String(reference_id) },
      order: [['created_at', 'DESC']]
    });
  }

  // Anti-doublon : détecte un paiement identique (même adhérent, type,
  // référence, montant ET description) créé il y a moins de `windowMs` — un
  // double-clic ou une double soumission envoie deux requêtes quasi
  // simultanées avant qu'un garde-fou front-end ne puisse les bloquer, ce qui
  // insérait deux lignes distinctes pour un seul paiement reçu.
  //
  // La description est incluse dans le match depuis l'introduction des
  // échéanciers : deux échéances d'un même échéancier partagent typiquement
  // le même adhérent/type/référence/montant (parts égales) et peuvent être
  // réglées à quelques secondes d'intervalle (paiements reçus le même jour) —
  // sans la description ("Échéance 1/3" vs "Échéance 2/3") elles seraient
  // incorrectement fusionnées en un seul paiement par ce garde-fou. Les flux
  // qui ne varient pas leur description (acompte manuel, double-clic) restent
  // protégés de la même façon qu'avant : les deux soumissions partagent alors
  // la même description (souvent null), donc toujours détectées comme doublon.
  async findRecentDuplicate({ num_adherent, type_paiement, reference_id, montant, description }, windowMs = 10000) {
    return await this.model.findOne({
      where: {
        num_adherent,
        type_paiement,
        reference_id: reference_id !== undefined && reference_id !== null ? String(reference_id) : null,
        montant,
        description: description !== undefined ? description : null,
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
