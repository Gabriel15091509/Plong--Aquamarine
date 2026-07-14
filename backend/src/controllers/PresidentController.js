const BaseController = require('./BaseController');
const PresidentService = require('../services/PresidentService');

class PresidentController extends BaseController {
  constructor() {
    const service = new PresidentService();
    super(service);
    this.presidentService = service;
  }

  async getCurrent(req, res) {
    try {
      const result = await this.presidentService.getCurrent();
      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Aucun président trouvé'
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

  async getByAnnee(req, res) {
    try {
      const { annee } = req.params;
      const result = await this.presidentService.getByAnnee(annee);
      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Aucun président trouvé pour cette année'
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

  async validateBeforeCreate(req, res, next) {
    const errors = await this.presidentService.validatePresidentData(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors
      });
    }
    next();
  }
}

module.exports = PresidentController;
