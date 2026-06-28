const BaseController = require('./BaseController');
const CertificatMedicalService = require('../services/CertificatMedicalService');

class CertificatMedicalController extends BaseController {
  constructor() {
    const service = new CertificatMedicalService();
    super(service);
    this.certificatService = service;
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
      const results = await this.certificatService.getCertificatesByAdherent(parseInt(num_adherent));
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

  async checkStatus(req, res) {
    try {
      const { num_adherent } = req.params;
      const status = await this.certificatService.checkCertificateStatus(parseInt(num_adherent));
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