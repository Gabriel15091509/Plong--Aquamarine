const BaseController = require("./BaseController");
const FormationSpecialiteService = require("../services/FormationSpecialiteService");
const { withStatus } = require("../utils/errors");

class FormationSpecialiteController extends BaseController {
  constructor() {
    const service = new FormationSpecialiteService();
    super(service);
    this.formationSpecialiteService = service;
  }

  async getByAdherent(req, res, next) {
    try {
      const { num_adherent } = req.params;
      const results = await this.formationSpecialiteService.getByAdherent(num_adherent);
      res.json({
        success: true,
        data: results,
        count: results.length,
      });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async getByMoniteur(req, res, next) {
    try {
      const { id_moniteur } = req.params;
      const results = await this.formationSpecialiteService.getByMoniteur(parseInt(id_moniteur, 10));
      res.json({
        success: true,
        data: results,
        count: results.length,
      });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async validateBeforeCreate(req, res, next) {
    const errors = await this.formationSpecialiteService.validateData(req.body, req.headers.authorization);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors,
      });
    }
    next();
  }
}

module.exports = FormationSpecialiteController;
