const BaseController = require('./BaseController');
const MoniteurService = require('../services/MoniteurService');
const { withStatus } = require('../utils/errors');

class MoniteurController extends BaseController {
  constructor() {
    const service = new MoniteurService();
    super(service);
    this.moniteurService = service;
  }

  async getByUserId(req, res, next) {
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
      next(withStatus(error, 500));
    }
  }

  async getBySpecialite(req, res, next) {
    try {
      const { specialite } = req.params;
      const results = await this.moniteurService.getBySpecialite(specialite);
      res.json({
        success: true,
        data: results,
        count: results.length
      });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async getDisponibles(req, res, next) {
    try {
      const results = await this.moniteurService.getDisponibles(req.query.jour);
      res.json({
        success: true,
        data: results,
        count: results.length
      });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async updateDisponibilite(req, res, next) {
    try {
      const { id } = req.params;
      const { disponible, cause } = req.body;
      const result = await this.moniteurService.updateDisponibilite(
        id,
        { disponible, cause },
        req.user,
      );
      res.json({
        success: true,
        data: result,
        message: disponible
          ? "Moniteur marqué disponible"
          : "Moniteur marqué indisponible",
      });
    } catch (error) {
      next(withStatus(error, 500));
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
