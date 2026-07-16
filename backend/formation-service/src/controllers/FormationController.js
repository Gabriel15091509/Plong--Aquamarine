const BaseController = require("./BaseController");
const FormationService = require("../services/FormationService");
const { withStatus } = require("../utils/errors");

class FormationController extends BaseController {
  constructor() {
    const service = new FormationService();
    super(service);
    this.formationService = service;
  }

  async getByAdherent(req, res, next) {
    try {
      const { num_adherent } = req.params;
      const results = await this.formationService.getFormationsByAdherent(
        num_adherent,
      );
      res.json({
        success: true,
        data: results,
        count: results.length,
      });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async getActiveFormations(req, res, next) {
    try {
      const results = await this.formationService.getActiveFormations();
      res.json({
        success: true,
        data: results,
        count: results.length,
      });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async getStats(req, res, next) {
    try {
      const stats = await this.formationService.getFormationStats();
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  // Consommé par le dashboard (encore dans le monolithe) via HTTP plutôt que
  // par une requête Sequelize directe sur un modèle qui ne lui appartient
  // plus — voir DashboardService.getTrends côté monolithe.
  async getTrend(req, res, next) {
    try {
      const trend = await this.formationService.getTrend();
      res.json({ success: true, data: trend });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async getWithCompetences(req, res, next) {
    try {
      const result = await this.formationService.getFormationWithCompetences(
        req.params.id,
      );
      if (!result) {
        return res.status(404).json({
          success: false,
          message: "Formation non trouvée",
        });
      }
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async create(req, res, next) {
    try {
      const result = await this.formationService.create(
        req.body,
        req.user,
        req.headers.authorization,
      );
      res.status(201).json({
        success: true,
        data: result,
        message: "Formation créée avec succès",
      });
    } catch (error) {
      next(withStatus(error, 400));
    }
  }

  async completeFormation(req, res, next) {
    try {
      const result = await this.formationService.completeFormation(
        req.params.id,
        req.headers.authorization,
      );
      res.json({
        success: true,
        data: result,
        message: "Formation terminée avec succès",
      });
    } catch (error) {
      next(withStatus(error, 400));
    }
  }

  async enregistrerPaiement(req, res, next) {
    try {
      const result = await this.formationService.enregistrerPaiement(
        req.params.id,
        req.body,
        req.user,
        req.headers.authorization,
      );
      res.json({
        success: true,
        data: result,
        message: "Paiement enregistré avec succès",
      });
    } catch (error) {
      next(withStatus(error, 400));
    }
  }

  async validateBeforeCreate(req, res, next) {
    const errors = await this.formationService.validateFormationData(
      req.body,
      req.headers.authorization,
    );
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors,
      });
    }
    next();
  }
}

module.exports = FormationController;
