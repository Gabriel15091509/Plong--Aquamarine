const BaseController = require('./BaseController');
const AdhesionService = require('../services/AdhesionService');
const identiteClient = require('../utils/serviceClients/identiteClient');
const { streamAttestationAdhesion } = require('../utils/pdf');
const { withStatus } = require('../utils/errors');

class AdhesionController extends BaseController {
  constructor() {
    const service = new AdhesionService();
    super(service);
    this.adhesionService = service;
  }

  async getAll(req, res, next) {
    try {
      const results = await this.adhesionService.getAll(req.user);
      res.json({
        success: true,
        data: results,
        message: "Opération réussie",
      });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async getById(req, res, next) {
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
      next(withStatus(error, 403));
    }
  }

  async getActiveAdhesions(req, res, next) {
    try {
      const results = await this.adhesionService.getActiveAdhesions();
      res.json({
        success: true,
        data: results,
        count: results.length
      });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async getExpiringAdhesions(req, res, next) {
    try {
      const { days } = req.query;
      const results = await this.adhesionService.getExpiringAdhesions(days ? parseInt(days) : 30);
      res.json({
        success: true,
        data: results,
        count: results.length
      });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async getByAdherent(req, res, next) {
    try {
      const { num_adherent } = req.params;
      const results = await this.adhesionService.getAdhesionsByAdherent(num_adherent, req.user);
      res.json({
        success: true,
        data: results,
        count: results.length
      });
    } catch (error) {
      next(withStatus(error, 403));
    }
  }

  async getStats(req, res, next) {
    try {
      const stats = await this.adhesionService.getAdhesionStats();
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async create(req, res, next) {
    try {
      const result = await this.adhesionService.create(req.body, req.user, req.headers.authorization);
      res.status(201).json({
        success: true,
        data: result,
        message: "Adhésion créée avec succès",
      });
    } catch (error) {
      next(withStatus(error, 400));
    }
  }

  async enregistrerPaiement(req, res, next) {
    try {
      const result = await this.adhesionService.enregistrerPaiementComplementaire(
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

  async getDossierStatus(req, res, next) {
    try {
      const { num_adherent } = req.params;
      const requiredTypes = req.query.types
        ? req.query.types.split(",").filter(Boolean)
        : undefined;
      const status = await this.adhesionService.checkDossierValidity(
        num_adherent,
        new Date(),
        requiredTypes,
      );
      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  // L'adhérent (civilité/nom/prénom) n'appartient plus à ce process : récupéré
  // via identite-service au lieu d'un `Adherent.findByPk` local.
  async getAttestation(req, res, next) {
    try {
      const { num_adherent } = req.params;
      const annee = req.query.annee ? parseInt(req.query.annee) : new Date().getFullYear();

      const adherent = await identiteClient.getAdherentById(num_adherent, req.headers.authorization);
      if (!adherent) {
        return res.status(404).json({ success: false, message: "Adhérent non trouvé" });
      }

      const adhesions = (
        await this.adhesionService.getAdhesionsByAdherent(num_adherent, req.user)
      ).filter((a) => a.annee_adhesion === annee);

      const dossier = await this.adhesionService.checkDossierValidity(num_adherent);

      await streamAttestationAdhesion(res, { adherent, adhesions, annee, dossier });
    } catch (error) {
      next(withStatus(error, 403));
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
