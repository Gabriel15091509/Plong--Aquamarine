const BaseController = require('./BaseController');
const MoniteurService = require('../services/MoniteurService');

class MoniteurController extends BaseController {
  constructor() {
    const service = new MoniteurService();
    super(service);
    this.moniteurService = service;
  }

  async getByUserId(req, res) {
    try {
      const { user_id } = req.params;
      const result = await this.moniteurService.getByUserId(user_id);
      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Moniteur non trouvé'
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

  async getBySpecialite(req, res) {
    try {
      const { specialite } = req.params;
      const results = await this.moniteurService.getBySpecialite(specialite);
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

  async getDisponibles(req, res) {
    try {
      const results = await this.moniteurService.getDisponibles();
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

  async validateBeforeCreate(req, res, next) {
    const errors = await this.moniteurService.validateMoniteurData(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors
      });
    }
    next();
  }
}

module.exports = MoniteurController;
