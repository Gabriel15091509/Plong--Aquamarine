const BaseService = require('./BaseService');
const PaiementRepository = require('../repositories/PaiementRepository');

class PaiementService extends BaseService {
  constructor() {
    const repository = new PaiementRepository();
    super(repository);
    this.paiementRepository = repository;
  }

  async getPendingPayments() {
    return await this.paiementRepository.findPendingPayments();
  }

  async getPaymentsByAdherent(num_adherent) {
    return await this.paiementRepository.findByAdherent(num_adherent);
  }

  // ✅ Ajout de getPaymentStats
  async getPaymentStats() {
    return await this.paiementRepository.getStats();
  }

  async getTotalPaymentsByPeriod(startDate, endDate) {
    return await this.paiementRepository.getTotalPaymentsByPeriod(startDate, endDate);
  }

  async validatePaymentData(data) {
    const errors = [];
    
    if (!data.num_adherent) errors.push('L\'adhérent est requis');
    if (!data.montant || data.montant <= 0) {
      errors.push('Le montant doit être supérieur à 0');
    }
    if (!data.mode) errors.push('Le mode de paiement est requis');
    if (!data.motif) errors.push('Le motif est requis');
    
    return errors;
  }

  async processPayment(id) {
    const payment = await this.getById(id);
    if (!payment) throw new Error('Paiement non trouvé');
    
    if (payment.statut === 'Validé') {
      throw new Error('Ce paiement a déjà été validé');
    }
    
    payment.statut = 'Validé';
    await payment.save();
    
    return payment;
  }

  async cancelPayment(id) {
    const payment = await this.getById(id);
    if (!payment) throw new Error('Paiement non trouvé');
    
    if (payment.statut === 'Remboursé') {
      throw new Error('Ce paiement a déjà été remboursé');
    }
    
    payment.statut = 'Annulé';
    await payment.save();
    
    return payment;
  }
}

module.exports = PaiementService;