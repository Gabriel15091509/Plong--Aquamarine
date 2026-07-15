const BaseController = require('./BaseController');
const CertificatMedicalService = require('../services/CertificatMedicalService');
const { withStatus } = require('../utils/errors');

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
