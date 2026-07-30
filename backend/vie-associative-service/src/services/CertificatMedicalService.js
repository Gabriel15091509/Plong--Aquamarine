const BaseService = require('./BaseService');
const CertificatMedicalRepository = require('../repositories/CertificatMedicalRepository');
const identiteClient = require('../utils/serviceClients/identiteClient');
const { analyserPhotoCertificat } = require('../utils/certificatPhotoAnalysis');

class CertificatMedicalService extends BaseService {
  constructor() {
    const repository = new CertificatMedicalRepository();
    super(repository);
    this.certificatRepository = repository;
  }

  // `statut` est saisi manuellement (par le moniteur/président) et ne se met
  // à jour tout seul qu'au passage du cron quotidien (voir expireOverdue) :
  // entre les deux, un certificat dont la date de validité est dépassée doit
  // quand même s'afficher/compter comme expiré partout où il est lu, plutôt
  // que de faire confiance à la colonne potentiellement périmée.
  deriveStatut(certificat) {
    const data = certificat.toJSON ? certificat.toJSON() : certificat;
    if (data.statut === 'Valide' && data.date_validite && new Date(data.date_validite) < new Date()) {
      return { ...data, statut: 'Expiré' };
    }
    return data;
  }

  async getAll(user = null) {
    const adherent = await identiteClient.getAdherentForUser(user);
    const certificats = adherent
      ? await this.certificatRepository.findByAdherent(adherent.num_adherent)
      : await this.certificatRepository.findAll();
    return certificats.map((c) => this.deriveStatut(c));
  }

  async getById(id, user = null) {
    const certificat = await this.certificatRepository.findById(id);
    if (certificat) {
      const adherent = await identiteClient.getAdherentForUser(user);
      if (adherent && certificat.num_adherent !== adherent.num_adherent) {
        throw new Error("Accès refusé à ce certificat");
      }
      return this.deriveStatut(certificat);
    }
    return certificat;
  }

  // Corrige en base les certificats en retard (cf.
  // CertificatMedicalRepository.expireOverdue) — appelé au démarrage puis
  // quotidiennement par un cron (voir app.js).
  async expireOverdueCertificates() {
    return await this.certificatRepository.expireOverdue();
  }

  async getValidCertificates() {
    return await this.certificatRepository.findValidCertificates();
  }

  async getExpiredCertificates() {
    const certificats = await this.certificatRepository.findExpiredCertificates();
    return certificats.map((c) => this.deriveStatut(c));
  }

  async getExpiringSoon(days = 30) {
    return await this.certificatRepository.findExpiringSoon(days);
  }

  async getCertificatesByAdherent(num_adherent, user = null) {
    const adherent = await identiteClient.getAdherentForUser(user);
    if (adherent && num_adherent !== adherent.num_adherent) {
      throw new Error("Accès refusé à ces certificats");
    }
    const certificats = await this.certificatRepository.findByAdherent(num_adherent);
    return certificats.map((c) => this.deriveStatut(c));
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

  async analyserPhoto(buffer, { num_adherent, medecin, date_validite, date_delivrance }, authHeader) {
    const adherent = await identiteClient.getAdherentById(num_adherent, authHeader);
    if (!adherent) {
      throw new Error("Adhérent non trouvé");
    }
    return await analyserPhotoCertificat(buffer, {
      nom: adherent.nom,
      prenom: adherent.prenom,
      medecin,
      dateValidite: date_validite,
      dateDelivrance: date_delivrance,
    });
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
