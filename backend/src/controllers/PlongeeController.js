const BaseController = require('./BaseController');
const PlongeeService = require('../services/PlongeeService');

class PlongeeController extends BaseController {
  constructor() {
    const service = new PlongeeService();
    super(service);
    this.plongeeService = service;
  }

  async getByAdherent(req, res) {
    try {
      const { num_adherent } = req.params;
      const results = await this.plongeeService.getPlongeesByAdherent(parseInt(num_adherent));
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

  async getWithDetails(req, res) {
    try {
      const result = await this.plongeeService.getPlongeeWithDetails(req.params.id);
      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Plongée non trouvée'
        });
      }
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // ✅ Ajout de getStats
  async getStats(req, res) {
    try {
      const stats = await this.plongeeService.getPlongeeStats();
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

  async getByDateRange(req, res) {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Les dates de début et de fin sont requises'
        });
      }
      const results = await this.plongeeService.getPlongeesByDateRange(
        new Date(startDate),
        new Date(endDate)
      );
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

  async validatePlongee(req, res) {
    try {
      const result = await this.plongeeService.validatePlongee(req.params.id);
      res.json({
        success: true,
        data: result,
        message: 'Plongée validée avec succès'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async validateBeforeCreate(req, res, next) {
    const errors = await this.plongeeService.validatePlongeeData(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors
      });
    }
    next();
  }
}

module.exports = PlongeeController;