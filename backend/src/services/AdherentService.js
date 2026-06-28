const BaseService = require("./BaseService");
const AdherentRepository = require("../repositories/AdherentRepository");

class AdherentService extends BaseService {
  constructor() {
    super(new AdherentRepository());
    this.repository = new AdherentRepository();
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

  // Ajouter cette méthode dans AdherentService.js

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

    // Validation spécifique
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
