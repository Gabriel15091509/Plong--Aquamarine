const BaseController = require('./BaseController');
const ReparationService = require('../services/ReparationService');

class ReparationController extends BaseController {
  constructor() {
    const service = new ReparationService();
    super(service);
    this.reparationService = service;
  }

  async getByMateriel(req, res) {
    try {
      const { num_inventaire } = req.params;
      const results = await this.reparationService.getByMateriel(num_inventaire);
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

  async getEnCours(req, res) {
    try {
      const results = await this.reparationService.getEnCours();
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

  async terminer(req, res) {
    try {
      const { id } = req.params;
      const { date_retour } = req.body;
      const result = await this.reparationService.terminer(id, date_retour);
      res.json({
        success: true,
        data: result,
        message: "Réparation terminée avec succès"
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async validateBeforeCreate(req, res, next) {
    const errors = await this.reparationService.validateReparationData(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors
      });
    }
    next();
  }
}

module.exports = ReparationController;
