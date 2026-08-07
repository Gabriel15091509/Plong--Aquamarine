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

  // Un adhérent peut soumettre lui-même son certificat médical ; l'entrée
  // reste "En attente" jusqu'à validation par le président (POST /:id/valider)
  // — même schéma que AdhesionService.create. `num_adherent` est toujours
  // recalculé depuis le token, jamais pris tel quel dans le corps de la
  // requête.
  async create(data, user = null) {
    const adherent = await identiteClient.getAdherentForUser(user);
    const estSoumissionAdherent = !!adherent;

    if (estSoumissionAdherent) {
      data = { ...data, num_adherent: adherent.num_adherent };
    }

    return await this.certificatRepository.create({
      ...data,
      soumis_par_adherent: estSoumissionAdherent,
      statut_validation: estSoumissionAdherent ? "En attente" : "Validé",
      valide_par: estSoumissionAdherent ? null : (user?.id ?? null),
      valide_le: estSoumissionAdherent ? null : new Date(),
    });
  }

  // Verrou réservé aux soumissions adhérent validées (soumis_par_adherent) —
  // un certificat saisi directement par le staff reste modifiable comme
  // avant (même distinguo que AdhesionService.update/delete).
  async update(id, data) {
    const certificat = await this.certificatRepository.findById(id);
    if (!certificat) throw new Error("Certificat non trouvé");
    if (certificat.soumis_par_adherent && certificat.statut_validation === "Validé") {
      throw new Error(
        "Certificat validé : non modifiable. Créez une nouvelle soumission si besoin d'une correction.",
      );
    }
    return await this.certificatRepository.update(id, data);
  }

  async delete(id) {
    const certificat = await this.certificatRepository.findById(id);
    if (!certificat) throw new Error("Certificat non trouvé");
    if (certificat.soumis_par_adherent && certificat.statut_validation === "Validé") {
      throw new Error("Certificat validé : suppression impossible.");
    }
    return await this.certificatRepository.delete(id);
  }

  // Réservé au président (voir routes) : bascule "En attente" vers "Validé"
  // ou "Rejeté" (motif requis, l'adhérent peut resoumettre).
  async validerCertificat(id, { decision, motif } = {}, user = null) {
    if (!["Validé", "Rejeté"].includes(decision)) {
      throw new Error('Décision invalide : "Validé" ou "Rejeté" attendu.');
    }
    const certificat = await this.certificatRepository.findById(id);
    if (!certificat) throw new Error("Certificat non trouvé");
    if (certificat.statut_validation !== "En attente") {
      throw new Error("Cette soumission a déjà été traitée et ne peut plus être modifiée.");
    }
    if (decision === "Rejeté" && !motif) {
      throw new Error("Un motif de rejet est requis.");
    }

    return await this.certificatRepository.update(id, {
      statut_validation: decision,
      valide_par: user?.id ?? null,
      valide_le: new Date(),
      motif_rejet: decision === "Rejeté" ? motif : null,
    });
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
      return validite >= now && c.statut === 'Valide' && c.statut_validation === 'Validé';
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
