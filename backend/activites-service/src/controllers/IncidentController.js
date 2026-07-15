const BaseController = require('./BaseController');
const IncidentService = require('../services/IncidentService');
const identiteClient = require('../utils/serviceClients/identiteClient');
const { withStatus } = require('../utils/errors');

class IncidentController extends BaseController {
  constructor() {
    const service = new IncidentService();
    super(service);
    this.incidentService = service;
  }

  async getBySortie(req, res, next) {
    try {
      const { id_sortie } = req.params;
      const results = await this.incidentService.getBySortie(id_sortie);
      res.json({
        success: true,
        data: results,
        count: results.length
      });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async getNonClotures(req, res, next) {
    try {
      const results = await this.incidentService.getNonClotures();
      res.json({
        success: true,
        data: results,
        count: results.length
      });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async cloturer(req, res, next) {
    try {
      const { id } = req.params;
      const { mesures_prises } = req.body;
      const result = await this.incidentService.cloturer(id, mesures_prises);
      res.json({
        success: true,
        data: result,
        message: 'Incident clôturé avec succès'
      });
    } catch (error) {
      next(withStatus(error, 400));
    }
  }

  // Moniteur/President vivent dans identite-service : résolus par HTTP au
  // lieu d'un `Moniteur.findOne`/`President.findOne` local.
  async create(req, res, next) {
    try {
      if (req.user && req.user.id) {
        const moniteur = await identiteClient.getMoniteurByUserId(req.user.id);
        const id_president = moniteur
          ? await identiteClient.getPresidentIdForMoniteur(moniteur.id_moniteur)
          : null;
        req.body.declared_by = id_president;
      }

      const result = await this.incidentService.create(req.body);
      res.status(201).json({
        success: true,
        data: result,
        message: 'Créé avec succès'
      });
    } catch (error) {
      next(withStatus(error, 400));
    }
  }

  async validateBeforeCreate(req, res, next) {
    const errors = await this.incidentService.validateIncidentData(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors
      });
    }
    next();
  }
}

module.exports = IncidentController;
