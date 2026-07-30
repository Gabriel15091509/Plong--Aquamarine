const BaseController = require('./BaseController');
const CompetenceService = require('../services/CompetenceService');
const { withStatus } = require('../utils/errors');

class CompetenceController extends BaseController {
  constructor() {
    const service = new CompetenceService();
    super(service);
    this.competenceService = service;
  }

  async getByFormation(req, res, next) {
    try {
      const { id_formation } = req.params;
      const results = await this.competenceService.getByFormation(parseInt(id_formation));
      res.json({
        success: true,
        data: results,
        count: results.length
      });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async valider(req, res, next) {
    try {
      const { id } = req.params;
      const { validee_par } = req.body;
      const result = await this.competenceService.valider(
        id,
        validee_par,
        req.headers.authorization,
        req.user,
      );
      res.json({
        success: true,
        data: result,
        message: "Compétence validée avec succès"
      });
    } catch (error) {
      next(withStatus(error, 400));
    }
  }

  // Surcharge de BaseController.update/delete : ceux-ci n'ont pas connaissance
  // de req.user, nécessaire ici pour le contrôle "seul le moniteur assigné à
  // la formation liée peut modifier/supprimer sa compétence".
  async update(req, res, next) {
    try {
      const result = await this.competenceService.update(req.params.id, req.body, req.user);
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
      await this.competenceService.delete(req.params.id, req.user);
      res.json({
        success: true,
        message: "Supprimé avec succès",
      });
    } catch (error) {
      next(withStatus(error, 400));
    }
  }

  async validateBeforeCreate(req, res, next) {
    const errors = await this.competenceService.validateCompetenceData(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors
      });
    }
    next();
  }
}

module.exports = CompetenceController;
