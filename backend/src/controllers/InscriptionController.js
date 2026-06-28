const BaseController = require('./BaseController');
const InscriptionService = require('../services/InscriptionService');

class InscriptionController extends BaseController {
  constructor() {
    const service = new InscriptionService();
    super(service);
    this.inscriptionService = service;
  }

  async getBySortie(req, res) {
    try {
      const { id_sortie } = req.params;
      const results = await this.inscriptionService.getConfirmationsBySortie(parseInt(id_sortie));
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

  async getByAdherentAndSortie(req, res) {
    try {
      const { num_adherent, id_sortie } = req.params;
      const result = await this.inscriptionService.getByAdherentAndSortie(
        parseInt(num_adherent),
        parseInt(id_sortie)
      );
      res.json({
        success: true,
        data: result || null
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getWaitlist(req, res) {
    try {
      const { id_sortie } = req.params;
      const results = await this.inscriptionService.getWaitlistBySortie(parseInt(id_sortie));
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

  async getStats(req, res) {
    try {
      const stats = await this.inscriptionService.getInscriptionStats();
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async createInscription(req, res) {
    try {
      const result = await this.inscriptionService.createInscription(req.body);
      res.status(201).json({
        success: true,
        data: result,
        message: 'Inscription créée avec succès'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async confirmInscription(req, res) {
    try {
      const result = await this.inscriptionService.confirmInscription(req.params.id);
      res.json({
        success: true,
        data: result,
        message: 'Inscription confirmée avec succès'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async cancelInscription(req, res) {
    try {
      const result = await this.inscriptionService.cancelInscription(req.params.id);
      res.json({
        success: true,
        data: result,
        message: 'Inscription annulée avec succès'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async validateBeforeCreate(req, res, next) {
    const errors = await this.inscriptionService.validateInscriptionData(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors
      });
    }
    next();
  }
}

module.exports = InscriptionController;