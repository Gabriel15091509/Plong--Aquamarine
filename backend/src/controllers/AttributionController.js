const BaseController = require('./BaseController');
const AttributionService = require('../services/AttributionService');

class AttributionController extends BaseController {
  constructor() {
    const service = new AttributionService();
    super(service);
    this.attributionService = service;
  }

  async getByAdherent(req, res) {
    try {
      const { num_adherent } = req.params;
      const results = await this.attributionService.getByAdherent(num_adherent);
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

  async getByMateriel(req, res) {
    try {
      const { num_inventaire } = req.params;
      const results = await this.attributionService.getByMateriel(num_inventaire);
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

  async getByPalanquee(req, res) {
    try {
      const { id_palanquee } = req.params;
      const results = await this.attributionService.getByPalanquee(parseInt(id_palanquee));
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

  async getEnCours(req, res) {
    try {
      const results = await this.attributionService.getEnCours();
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

  async retourner(req, res) {
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
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async enregistrerCaution(req, res) {
    try {
      const { id } = req.params;
      const result = await this.attributionService.enregistrerCaution(id, req.body, req.user);
      res.json({
        success: true,
        data: result,
        message: "Caution enregistrée avec succès",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async restituerCaution(req, res) {
    try {
      const { id } = req.params;
      const result = await this.attributionService.restituerCaution(id);
      res.json({
        success: true,
        data: result,
        message: "Caution restituée avec succès",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async traiterDeterioration(req, res) {
    try {
      const { id } = req.params;
      const result = await this.attributionService.traiterDeterioration(id, req.body);
      res.json({
        success: true,
        data: result,
        message: "Détérioration traitée avec succès",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
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
