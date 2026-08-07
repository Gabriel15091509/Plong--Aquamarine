const path = require('path');
const BaseController = require('./BaseController');
const CertificatMedicalService = require('../services/CertificatMedicalService');
const { readEncryptedDocument } = require('../middlewares/upload');
const { withStatus } = require('../utils/errors');

const MIMETYPES_BY_EXT = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

class CertificatMedicalController extends BaseController {
  constructor() {
    const service = new CertificatMedicalService();
    super(service);
    this.certificatService = service;
  }

  async getAll(req, res, next) {
    try {
      const results = await this.certificatService.getAll(req.user);
      res.json({
        success: true,
        data: results,
        message: "Opération réussie",
      });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async getById(req, res, next) {
    try {
      const result = await this.certificatService.getById(req.params.id, req.user);
      if (!result) {
        return res.status(404).json({
          success: false,
          message: "Certificat non trouvé",
        });
      }
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(withStatus(error, 403));
    }
  }

  // BaseController.create n'appelle this.service.create(req.body) qu'avec le
  // body — sans req.user, CertificatMedicalService.create ne peut jamais
  // détecter une auto-soumission (identiteClient.getAdherentForUser(null)
  // renvoie toujours null) : tout certificat, y compris ceux soumis par un
  // adhérent, se retrouvait "Validé" d'office. Override nécessaire, même
  // motif que AdhesionController.create.
  async create(req, res, next) {
    try {
      const result = await this.certificatService.create(req.body, req.user);
      res.status(201).json({
        success: true,
        data: result,
        message: "Certificat créé avec succès",
      });
    } catch (error) {
      next(withStatus(error, 400));
    }
  }

  // Document médical chiffré au repos (exigence 4.4) : déchiffré ici, à la
  // volée, jamais servi en statique. Réutilise l'autorisation déjà
  // appliquée par getById (adhérent propriétaire, ou staff sans fiche
  // adhérent liée).
  async downloadDocument(req, res, next) {
    try {
      const certificat = await this.certificatService.getById(req.params.id, req.user);
      if (!certificat || !certificat.document_path) {
        return res.status(404).json({
          success: false,
          message: "Document non trouvé",
        });
      }

      const buffer = readEncryptedDocument("certificats", certificat.document_path);
      const ext = path.extname(certificat.document_path).toLowerCase();

      res.setHeader("Content-Type", MIMETYPES_BY_EXT[ext] || "application/octet-stream");
      res.setHeader(
        "Content-Disposition",
        `inline; filename="certificat-${certificat.id_certificat}${ext}"`,
      );
      res.send(buffer);
    } catch (error) {
      next(withStatus(error, 403));
    }
  }

  async getValidCertificates(req, res, next) {
    try {
      const results = await this.certificatService.getValidCertificates();
      res.json({
        success: true,
        data: results,
        count: results.length
      });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  // Endpoint interne, appelé par le monolithe (AdherentController.
  // getWithExpiringCertificates via vieAssociativeClient) pour obtenir les
  // num_adherent dont un certificat valide expire bientôt.
  async getExpiringSoon(req, res, next) {
    try {
      const days = req.query.days ? parseInt(req.query.days) : 30;
      const results = await this.certificatService.getExpiringSoon(days);
      res.json({
        success: true,
        data: results,
        count: results.length
      });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async getExpiredCertificates(req, res, next) {
    try {
      const results = await this.certificatService.getExpiredCertificates();
      res.json({
        success: true,
        data: results,
        count: results.length
      });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async getByAdherent(req, res, next) {
    try {
      const { num_adherent } = req.params;
      const results = await this.certificatService.getCertificatesByAdherent(num_adherent, req.user);
      res.json({
        success: true,
        data: results,
        count: results.length
      });
    } catch (error) {
      next(withStatus(error, 403));
    }
  }

  async checkStatus(req, res, next) {
    try {
      const { num_adherent } = req.params;
      const status = await this.certificatService.checkCertificateStatus(num_adherent);
      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  // Vérification "un peu" de cohérence entre une photo (webcam ou import) et
  // les informations déjà saisies dans le formulaire (nom/prénom de
  // l'adhérent, médecin, dates) — jamais bloquante côté frontend, l'OCR d'un
  // certificat manuscrit/tamponné n'étant pas fiable à 100%.
  async analysePhoto(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "Photo requise" });
      }
      const resultat = await this.certificatService.analyserPhoto(
        req.file.buffer,
        req.body,
        req.headers.authorization,
      );
      res.json({ success: true, data: resultat });
    } catch (error) {
      next(withStatus(error, 400));
    }
  }

  async valider(req, res, next) {
    try {
      const { decision, motif } = req.body;
      const result = await this.certificatService.validerCertificat(
        req.params.id,
        { decision, motif },
        req.user,
      );
      res.json({
        success: true,
        data: result,
        message: decision === "Validé" ? "Certificat validé" : "Certificat rejeté",
      });
    } catch (error) {
      next(withStatus(error, 400));
    }
  }

  async validateBeforeCreate(req, res, next) {
    const errors = await this.certificatService.validateCertificatData(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors
      });
    }
    next();
  }
}

module.exports = CertificatMedicalController;
