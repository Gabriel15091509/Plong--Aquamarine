const BaseController = require('./BaseController');
const IncidentService = require('../services/IncidentService');
const { Moniteur, President } = require('../models');

class IncidentController extends BaseController {
  constructor() {
    const service = new IncidentService();
    super(service);
    this.incidentService = service;
  }

  async getBySortie(req, res) {
    try {
      const { id_sortie } = req.params;
      const results = await this.incidentService.getBySortie(id_sortie);
      res.json({
        success: true,
        data: results,
        count: results.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getNonClotures(req, res) {
    try {
      const results = await this.incidentService.getNonClotures();
      res.json({
        success: true,
        data: results,
        count: results.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async cloturer(req, res) {
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
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async create(req, res) {
    try {
      if (req.user && req.user.id) {
        const moniteur = await Moniteur.findOne({ where: { user_id: req.user.id } });
        const president = moniteur
          ? await President.findOne({ where: { id_moniteur: moniteur.id_moniteur } })
          : null;
        req.body.declared_by = president ? president.id_president : null;
      }

      const result = await this.incidentService.create(req.body);
      res.status(201).json({
        success: true,
        data: result,
        message: 'Créé avec succès'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
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
