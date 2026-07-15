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
      const result = await this.competenceService.valider(id, validee_par);
      res.json({
        success: true,
        data: result,
        message: "Compétence validée avec succès"
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
