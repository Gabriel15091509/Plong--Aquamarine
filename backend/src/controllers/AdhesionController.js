const BaseController = require('./BaseController');
const AdhesionService = require('../services/AdhesionService');

class AdhesionController extends BaseController {
  constructor() {
    const service = new AdhesionService();
    super(service);
    this.adhesionService = service;
  }

  async getActiveAdhesions(req, res) {
    try {
      const results = await this.adhesionService.getActiveAdhesions();
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

  async getExpiringAdhesions(req, res) {
    try {
      const { days } = req.query;
      const results = await this.adhesionService.getExpiringAdhesions(days ? parseInt(days) : 30);
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
      const results = await this.adhesionService.getAdhesionsByAdherent(parseInt(num_adherent));
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

  async getStats(req, res) {
    try {
      const stats = await this.adhesionService.getAdhesionStats();
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async validateBeforeCreate(req, res, next) {
    const errors = await this.adhesionService.validateAdhesionData(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors
      });
    }
    next();
  }
}

module.exports = AdhesionController;