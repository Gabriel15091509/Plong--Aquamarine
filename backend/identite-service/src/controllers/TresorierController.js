const BaseController = require('./BaseController');
const TresorierService = require('../services/TresorierService');
const { withStatus } = require('../utils/errors');

class TresorierController extends BaseController {
  constructor() {
    const service = new TresorierService();
    super(service);
    this.tresorierService = service;
  }

  async getByUserId(req, res, next) {
    try {
      const { user_id } = req.params;
      const result = await this.tresorierService.getByUserId(user_id);
      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Trésorier non trouvé'
        });
      }
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async getByAnnee(req, res, next) {
    try {
      const { annee } = req.params;
      const result = await this.tresorierService.getByAnnee(annee);
      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Aucun trésorier trouvé pour cette année'
        });
      }
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async validateBeforeCreate(req, res, next) {
    const errors = await this.tresorierService.validateTresorierData(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors
      });
    }
    next();
  }
}

module.exports = TresorierController;
