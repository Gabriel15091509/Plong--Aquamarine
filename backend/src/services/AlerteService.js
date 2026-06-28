const BaseService = require('./BaseService');
const AlerteRepository = require('../repositories/AlerteRepository');

class AlerteService extends BaseService {
  constructor() {
    const repository = new AlerteRepository();
    super(repository);
    this.alerteRepository = repository;
  }

  async getUnread() {
    return await this.alerteRepository.findUnread();
  }

  async getByAdherent(num_adherent) {
    return await this.alerteRepository.findByAdherent(num_adherent);
  }

  async markAsRead(id) {
    return await this.alerteRepository.markAsRead(id);
  }

  async markAllAsRead() {
    return await this.alerteRepository.markAllAsRead();
  }

  async getStats() {
    return await this.alerteRepository.getStats();
  }

  async getUnreadCount() {
    return await this.alerteRepository.getUnreadCount();
  }

  async createAlerte(data) {
    // Vérifier si l'adhérent existe
    const { Adherent } = require('../models');
    const adherent = await Adherent.findByPk(data.num_adherent);
    if (!adherent) {
      throw new Error('Adhérent non trouvé');
    }

    return await this.alerteRepository.create({
      ...data,
      date_envoi: new Date(),
      statut: 'Envoyé',
      read: false
    });
  }

  async validateAlerteData(data) {
    const errors = [];
    
    if (!data.num_adherent) errors.push('L\'adhérent est requis');
    if (!data.type) errors.push('Le type d\'alerte est requis');
    if (!data.canal) errors.push('Le canal est requis');
    
    const validTypes = ['Certificat expiré', 'Adhésion expirée', 'Paiement en retard', 'Formation'];
    if (data.type && !validTypes.includes(data.type)) {
      errors.push('Type d\'alerte invalide');
    }
    
    const validCanaux = ['Email', 'SMS', 'Notification'];
    if (data.canal && !validCanaux.includes(data.canal)) {
      errors.push('Canal invalide');
    }
    
    return errors;
  }
}

module.exports = AlerteService;