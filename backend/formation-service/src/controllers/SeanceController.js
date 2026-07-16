const BaseController = require("./BaseController");
const SeanceService = require("../services/SeanceService");
const { withStatus } = require("../utils/errors");

class SeanceController extends BaseController {
  constructor() {
    const service = new SeanceService();
    super(service);
    this.seanceService = service;
  }

  async getByFormation(req, res, next) {
    try {
      const { id_formation } = req.params;
      const results = await this.seanceService.getByFormation(parseInt(id_formation, 10));
      res.json({
        success: true,
        data: results,
        count: results.length,
      });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async getEncadrementByMoniteur(req, res, next) {
    try {
      const { id_moniteur } = req.params;
      const result = await this.seanceService.getEncadrementByMoniteur(parseInt(id_moniteur, 10));
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async updateStatut(req, res, next) {
    try {
      const result = await this.seanceService.updateStatut(req.params.id, req.body);
      res.json({
        success: true,
        data: result,
        message: "Statut de la séance mis à jour avec succès",
      });
    } catch (error) {
      next(withStatus(error, 400));
    }
  }

  async validateBeforeCreate(req, res, next) {
    const errors = await this.seanceService.validateSeanceData(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors,
      });
    }
    next();
  }
}

module.exports = SeanceController;
