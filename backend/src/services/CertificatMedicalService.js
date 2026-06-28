const BaseService = require('./BaseService');
const CertificatMedicalRepository = require('../repositories/CertificatMedicalRepository');

class CertificatMedicalService extends BaseService {
  constructor() {
    const repository = new CertificatMedicalRepository();
    super(repository);
    this.certificatRepository = repository;
  }

  async getValidCertificates() {
    return await this.certificatRepository.findValidCertificates();
  }

  async getExpiredCertificates() {
    return await this.certificatRepository.findExpiredCertificates();
  }

  async getCertificatesByAdherent(num_adherent) {
    return await this.certificatRepository.findByAdherent(num_adherent);
  }

  async validateCertificatData(data) {
    const errors = [];
    
    if (!data.num_adherent) errors.push('L\'adhérent est requis');
    if (!data.type_certificat) errors.push('Le type de certificat est requis');
    if (!data.date_validite) errors.push('La date de validité est requise');
    if (!data.medecin) errors.push('Le médecin est requis');
    
    if (data.date_validite) {
      const validite = new Date(data.date_validite);
      const now = new Date();
      if (validite < now) {
        errors.push('La date de validité doit être future');
      }
    }
    
    return errors;
  }

  async checkCertificateStatus(num_adherent) {
    const certificates = await this.getCertificatesByAdherent(num_adherent);
    const now = new Date();
    
    const valid = certificates.filter(c => {
      const validite = new Date(c.date_validite);
      return validite >= now && c.statut === 'Valide';
    });
    
    const expired = certificates.filter(c => {
      const validite = new Date(c.date_validite);
      return validite < now;
    });
    
    return {
      total: certificates.length,
      valid: valid.length,
      expired: expired.length,
      hasValidCertificate: valid.length > 0
    };
  }
}

module.exports = CertificatMedicalService;