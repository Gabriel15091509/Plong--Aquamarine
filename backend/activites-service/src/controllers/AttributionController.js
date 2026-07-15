const BaseController = require('./BaseController');
const AttributionService = require('../services/AttributionService');
const { withStatus } = require('../utils/errors');

class AttributionController extends BaseController {
  constructor() {
    const service = new AttributionService();
    super(service);
    this.attributionService = service;
  }

  async getByAdherent(req, res, next) {
    try {
      const { num_adherent } = req.params;
      const results = await this.attributionService.getByAdherent(num_adherent);
      res.json({
        success: true,
        data: results,
        count: results.length
      });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async getByMateriel(req, res, next) {
    try {
      const { num_inventaire } = req.params;
      const results = await this.attributionService.getByMateriel(num_inventaire);
      res.json({
        success: true,
        data: results,
        count: results.length
      });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async getByPalanquee(req, res, next) {
    try {
      const { id_palanquee } = req.params;
      const results = await this.attributionService.getByPalanquee(parseInt(id_palanquee), req.headers.authorization);
      res.json({
        success: true,
        data: results,
        count: results.length
      });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async getEnCours(req, res, next) {
    try {
      const results = await this.attributionService.getEnCours();
      res.json({
        success: true,
        data: results,
        count: results.length
      });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async retourner(req, res, next) {
    try {
      const { id } = req.params;
      const { etat_retour, date_retour_reel } = req.body;
      const result = await this.attributionService.retourner(id, { etat_retour, date_retour_reel });
      res.json({
        success: true,
        data: result,
        message: "Retour enregistré avec succès"
      });
    } catch (error) {
      next(withStatus(error, 400));
    }
  }

  async enregistrerCaution(req, res, next) {
    try {
      const { id } = req.params;
      const result = await this.attributionService.enregistrerCaution(id, req.body, req.user, req.headers.authorization);
      res.json({
        success: true,
        data: result,
        message: "Caution enregistrée avec succès",
      });
    } catch (error) {
      next(withStatus(error, 400));
    }
  }

  async restituerCaution(req, res, next) {
    try {
      const { id } = req.params;
      const result = await this.attributionService.restituerCaution(id, req.headers.authorization);
      res.json({
        success: true,
        data: result,
        message: "Caution restituée avec succès",
      });
    } catch (error) {
      next(withStatus(error, 400));
    }
  }

  async traiterDeterioration(req, res, next) {
    try {
      const { id } = req.params;
      const result = await this.attributionService.traiterDeterioration(id, req.body, req.headers.authorization);
      res.json({
        success: true,
        data: result,
        message: "Détérioration traitée avec succès",
      });
    } catch (error) {
      next(withStatus(error, 400));
    }
  }

  async validateBeforeCreate(req, res, next) {
    const errors = await this.attributionService.validateAttributionData(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors
      });
    }
    next();
  }
}

module.exports = AttributionController;
