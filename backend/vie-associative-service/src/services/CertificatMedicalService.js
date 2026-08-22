const BaseService = require('./BaseService');
const CertificatMedicalRepository = require('../repositories/CertificatMedicalRepository');
const identiteClient = require('../utils/serviceClients/identiteClient');
const { analyserPhotoCertificat } = require('../utils/certificatPhotoAnalysis');
const { readEncryptedDocument } = require('../middlewares/upload');
const { judgeDocumentCoherence } = require('../utils/groqClient');

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

  // Un adhérent peut soumettre lui-même son certificat médical. Plus de
  // validation manuelle systématique du président pour ce circuit : Groq
  // tranche seul (Validé/Rejeté) quand il répond, voir judgeSubmittedDocument.
  // Une entrée créée directement par le staff reste "Validé" d'office comme
  // avant. `num_adherent` est toujours recalculé depuis le token, jamais
  // pris tel quel dans le corps de la requête.
  async create(data, user = null) {
    const adherent = await identiteClient.getAdherentForUser(user);
    const estSoumissionAdherent = !!adherent;

    if (estSoumissionAdherent) {
      data = { ...data, num_adherent: adherent.num_adherent };
    }

    let statut_validation = "Validé";
    let valide_par = user?.id ?? null;
    let valide_le = new Date();
    let motif_rejet = null;

    if (estSoumissionAdherent) {
      const decision = await this.judgeSubmittedDocument({
        document_path: data.document_path,
        adherent,
        champs: {
          medecin: data.medecin,
          date_validite: data.date_validite,
          date_delivrance: data.date_delivrance,
        },
      });
      statut_validation = decision.decision;
      valide_par = null;
      // "En attente" (Groq indisponible, voir groqClient.judgeDocumentCoherence)
      // n'est pas une décision prise : pas de date de validation tant que
      // le président n'a pas réellement tranché.
      valide_le = decision.decision === "En attente" ? null : new Date();
      motif_rejet = decision.decision === "Rejeté" ? decision.motif : null;
    }

    return await this.certificatRepository.create({
      ...data,
      soumis_par_adherent: estSoumissionAdherent,
      statut_validation,
      valide_par,
      valide_le,
      motif_rejet,
    });
  }

  // Décision automatique — même principe que AdhesionService.
  // judgeSubmittedDocument : relit le document (déchiffré, exigence 4.4)
  // tout juste enregistré, réutilise les heuristiques OCR de l'aperçu
  // pré-soumission (analyserPhotoCertificat), puis soumet le texte détecté
  // + les champs saisis à Groq (une indisponibilité de Groq lui-même
  // bascule sur "En attente", pas un rejet — voir groqClient.
  // judgeDocumentCoherence). Un document absent ou illisible côté adhérent
  // (pas un problème Groq) reste rejeté immédiatement ci-dessous.
  async judgeSubmittedDocument({ document_path, adherent, champs }) {
    if (!document_path) {
      return {
        decision: "Rejeté",
        motif: "Aucun document fourni avec cette soumission.",
      };
    }

    // Fichier illisible/corrompu/indéchiffrable : pas un problème Groq
    // (jamais atteint), donc pas de repli "En attente" ici non plus.
    try {
      const buffer = await readEncryptedDocument("certificats", document_path);
      const champsAttendus = {
        nom: adherent.nom,
        prenom: adherent.prenom,
        medecin: champs.medecin,
        date_validite: champs.date_validite,
        date_delivrance: champs.date_delivrance,
      };

      const analyse = await analyserPhotoCertificat(buffer, {
        nom: adherent.nom,
        prenom: adherent.prenom,
        medecin: champs.medecin,
        dateValidite: champs.date_validite,
        dateDelivrance: champs.date_delivrance,
      });

      return await judgeDocumentCoherence({
        typeDocument: "Certificat médical",
        champsAttendus,
        texteOcr: analyse.texteDetecte,
        avertissementsHeuristiques: analyse.avertissements,
      });
    } catch (error) {
      return {
        decision: "Rejeté",
        motif: "Le document envoyé n'a pas pu être analysé (fichier illisible, corrompu, ou déchiffrement impossible).",
      };
    }
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
