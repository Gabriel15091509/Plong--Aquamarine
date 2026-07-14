const BaseController = require('./BaseController');
const AdhesionService = require('../services/AdhesionService');
const { Adherent } = require('../models');
const { streamAttestationAdhesion } = require('../utils/pdf');

class AdhesionController extends BaseController {
  constructor() {
    const service = new AdhesionService();
    super(service);
    this.adhesionService = service;
  }

  async getAll(req, res) {
    try {
      const results = await this.adhesionService.getAll(req.user);
      res.json({
        success: true,
        data: results,
        message: "Opération réussie",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getById(req, res) {
    try {
      const result = await this.adhesionService.getById(req.params.id, req.user);
      if (!result) {
        return res.status(404).json({
          success: false,
          message: "Adhésion non trouvée",
        });
      }
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(403).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getActiveAdhesions(req, res) {
    try {
      const results = await this.adhesionService.getActiveAdhesions();
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

  async getExpiringAdhesions(req, res) {
    try {
      const { days } = req.query;
      const results = await this.adhesionService.getExpiringAdhesions(days ? parseInt(days) : 30);
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

  async getByAdherent(req, res) {
    try {
      const { num_adherent } = req.params;
      const results = await this.adhesionService.getAdhesionsByAdherent(num_adherent, req.user);
      res.json({
        success: true,
        data: results,
        count: results.length
      });
    } catch (error) {
      res.status(403).json({
        success: false,
        message: error.message
      });
    }
  }

  async getStats(req, res) {
    try {
      const stats = await this.adhesionService.getAdhesionStats();
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

  async create(req, res) {
    try {
      const result = await this.adhesionService.create(req.body, req.user);
      res.status(201).json({
        success: true,
        data: result,
        message: "Adhésion créée avec succès",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async enregistrerPaiement(req, res) {
    try {
      const result = await this.adhesionService.enregistrerPaiementComplementaire(
        req.params.id,
        req.body,
        req.user,
      );
      res.json({
        success: true,
        data: result,
        message: "Paiement enregistré avec succès",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getDossierStatus(req, res) {
    try {
      const { num_adherent } = req.params;
      const status = await this.adhesionService.checkDossierValidity(num_adherent);
      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getAttestation(req, res) {
    try {
      const { num_adherent } = req.params;
      const annee = req.query.annee ? parseInt(req.query.annee) : new Date().getFullYear();

      const adherent = await Adherent.findByPk(num_adherent);
      if (!adherent) {
        return res.status(404).json({ success: false, message: "Adhérent non trouvé" });
      }

      const adhesions = (
        await this.adhesionService.getAdhesionsByAdherent(num_adherent, req.user)
      ).filter((a) => a.annee_adhesion === annee);

      const dossier = await this.adhesionService.checkDossierValidity(num_adherent);

      await streamAttestationAdhesion(res, { adherent, adhesions, annee, dossier });
    } catch (error) {
      res.status(403).json({
        success: false,
        message: error.message,
      });
    }
  }

  async validateBeforeCreate(req, res, next) {
    const errors = await this.adhesionService.validateAdhesionData(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors
      });
    }
    next();
  }
}

module.exports = AdhesionController;