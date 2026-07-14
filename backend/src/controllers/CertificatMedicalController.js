const BaseController = require('./BaseController');
const CertificatMedicalService = require('../services/CertificatMedicalService');

class CertificatMedicalController extends BaseController {
  constructor() {
    const service = new CertificatMedicalService();
    super(service);
    this.certificatService = service;
  }

  async getAll(req, res) {
    try {
      const results = await this.certificatService.getAll(req.user);
      res.json({
        success: true,
        data: results,
        message: "Opération réussie",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getById(req, res) {
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
      res.status(403).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getValidCertificates(req, res) {
    try {
      const results = await this.certificatService.getValidCertificates();
      res.json({
        success: true,
        data: results,
        count: results.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getExpiredCertificates(req, res) {
    try {
      const results = await this.certificatService.getExpiredCertificates();
      res.json({
        success: true,
        data: results,
        count: results.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getByAdherent(req, res) {
    try {
      const { num_adherent } = req.params;
      const results = await this.certificatService.getCertificatesByAdherent(num_adherent, req.user);
      res.json({
        success: true,
        data: results,
        count: results.length
      });
    } catch (error) {
      res.status(403).json({
        success: false,
        message: error.message
      });
    }
  }

  async checkStatus(req, res) {
    try {
      const { num_adherent } = req.params;
      const status = await this.certificatService.checkCertificateStatus(num_adherent);
      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
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