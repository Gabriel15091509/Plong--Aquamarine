// backend/services/AdherentService.js
const BaseService = require("./BaseService");
const AdherentRepository = require("../repositories/AdherentRepository");

class AdherentService extends BaseService {
  constructor() {
    super(new AdherentRepository());
    this.repository = new AdherentRepository();
  }

  // ✅ AJOUTER CETTE MÉTHODE MANQUANTE
  async getAdherentByEmail(email) {
    return await this.repository.findByEmail(email);
  }

  // ✅ AJOUTER CETTE MÉTHODE MANQUANTE
  async getAdherentsByNiveau(niveau) {
    return await this.repository.findByNiveau(niveau);
  }

  // ✅ AJOUTER CETTE MÉTHODE MANQUANTE
  async searchAdherents(query) {
    return await this.repository.search(query);
  }

  async getAdherentWithDetails(id) {
    return await this.repository.findWithDetails(id);
  }

  async getActiveAdherents() {
    return await this.repository.findActiveAdherents();
  }

  async getAdherentsWithExpiringCertificates() {
    return await this.repository.findAdherentsWithExpiringCertificates();
  }

  async getAdherentStats() {
    const total = await this.repository.count();
    const active = await this.repository.count({ statut: "Actif" });
    const inactive = await this.repository.count({ statut: "Inactif" });
    const suspended = await this.repository.count({ statut: "Suspendu" });

    return {
      total,
      active,
      inactive,
      suspended,
    };
  }

  async validateAdherentData(data) {
    const errors = [];

    if (!data.nom) errors.push("Le nom est requis");
    if (!data.prenom) errors.push("Le prénom est requis");
    if (!data.email) errors.push("L'email est requis");
    if (data.email && !this.isValidEmail(data.email)) {
      errors.push("Email invalide");
    }

    return errors;
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

module.exports = AdherentService;
