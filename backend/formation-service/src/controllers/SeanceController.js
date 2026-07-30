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

  async getPlanifieesByAdherent(req, res, next) {
    try {
      const { num_adherent } = req.params;
      const results = await this.seanceService.getPlanifieesByAdherent(num_adherent);
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
      const result = await this.seanceService.updateStatut(
        req.params.id,
        req.body,
        req.headers.authorization,
        req.user,
      );
      res.json({
        success: true,
        data: result,
        message: "Statut de la séance mis à jour avec succès",
      });
    } catch (error) {
      next(withStatus(error, 400));
    }
  }

  // Surcharge de BaseController.update/delete : ceux-ci n'ont pas connaissance
  // de req.user, nécessaire ici pour le contrôle "seul le moniteur assigné à
  // la formation liée peut modifier/supprimer sa séance".
  async update(req, res, next) {
    try {
      const result = await this.seanceService.update(req.params.id, req.body, req.user);
      res.json({
        success: true,
        data: result,
        message: "Mis à jour avec succès",
      });
    } catch (error) {
      next(withStatus(error, 400));
    }
  }

  async delete(req, res, next) {
    try {
      await this.seanceService.delete(req.params.id, req.user);
      res.json({
        success: true,
        message: "Supprimé avec succès",
      });
    } catch (error) {
      next(withStatus(error, 400));
    }
  }

  async validateBeforeCreate(req, res, next) {
    const errors = await this.seanceService.validateSeanceData(req.body, req.headers.authorization);
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
