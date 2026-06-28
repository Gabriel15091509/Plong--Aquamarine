const BaseController = require("./BaseController");
const FormationService = require("../services/FormationService");

class FormationController extends BaseController {
  constructor() {
    const service = new FormationService();
    super(service);
    this.formationService = service;
  }

  async getByAdherent(req, res) {
    try {
      const { num_adherent } = req.params;
      const results = await this.formationService.getFormationsByAdherent(
        parseInt(num_adherent),
      );
      res.json({
        success: true,
        data: results,
        count: results.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getActiveFormations(req, res) {
    try {
      const results = await this.formationService.getActiveFormations();
      res.json({
        success: true,
        data: results,
        count: results.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // ✅ Ajout de getStats
  async getStats(req, res) {
    try {
      const stats = await this.formationService.getFormationStats();
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getWithCompetences(req, res) {
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
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async incrementSessions(req, res) {
    try {
      const result = await this.formationService.incrementSessions(
        req.params.id,
      );
      res.json({
        success: true,
        data: result,
        message: "Nombre de séances incrémenté",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async completeFormation(req, res) {
    try {
      const result = await this.formationService.completeFormation(
        req.params.id,
      );
      res.json({
        success: true,
        data: result,
        message: "Formation terminée avec succès",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async validateBeforeCreate(req, res, next) {
    const errors = await this.formationService.validateFormationData(req.body);
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
