const BaseController = require('./BaseController');
const PlongeeService = require('../services/PlongeeService');
const identiteClient = require('../utils/serviceClients/identiteClient');
const { withStatus } = require('../utils/errors');
const { streamCarnetPlongee, streamAttestationSuiviPlongee } = require('../utils/pdf');

class PlongeeController extends BaseController {
  constructor() {
    const service = new PlongeeService();
    super(service);
    this.plongeeService = service;
  }

  async getAll(req, res, next) {
    try {
      const results = await this.plongeeService.getAll(req.user);
      res.json({
        success: true,
        data: results,
        count: results.length,
      });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async getById(req, res, next) {
    try {
      const result = await this.plongeeService.getById(req.params.id, req.user);
      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Plongée non trouvée'
        });
      }
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(withStatus(error, 403));
    }
  }

  async getByAdherent(req, res, next) {
    try {
      const { num_adherent } = req.params;
      const results = await this.plongeeService.getPlongeesByAdherent(num_adherent, req.user);
      // Agrégats du carnet de plongée (CDC 3.3.2), calculés ici plutôt qu'en
      // SQL : `results` est déjà chargé pour la réponse, et la volumétrie par
      // adhérent reste faible (pas besoin d'une requête d'agrégation dédiée).
      const profondeurMax = results.reduce((max, p) => Math.max(max, p.profondeur_max || 0), 0);
      const dureeTotale = results.reduce((total, p) => total + (p.duree || 0), 0);
      res.json({
        success: true,
        data: results,
        count: results.length,
        profondeurMax,
        dureeTotale,
      });
    } catch (error) {
      next(withStatus(error, 403));
    }
  }

  // Export PDF du carnet de plongée (CDC 3.3.3). Adherent (identite-service)
  // n'appartient plus à ce process : récupéré via HTTP pour l'en-tête du
  // document.
  async getCarnetPdf(req, res, next) {
    try {
      const { num_adherent } = req.params;
      const plongees = await this.plongeeService.getPlongeesByAdherent(num_adherent, req.user);
      const adherent = await identiteClient.getAdherentById(num_adherent, req.headers.authorization);
      if (!adherent) {
        return res.status(404).json({ success: false, message: 'Adhérent non trouvé' });
      }
      const profondeurMax = plongees.reduce((max, p) => Math.max(max, p.profondeur_max || 0), 0);
      const dureeTotale = plongees.reduce((total, p) => total + (p.duree || 0), 0);
      await streamCarnetPlongee(res, { adherent, plongees, profondeurMax, dureeTotale });
    } catch (error) {
      next(withStatus(error, 403));
    }
  }

  // Export PDF de l'attestation de suivi de plongée : récapitulatif formel
  // (plongées validées, profondeur max, période couverte) — seules les
  // plongées validées par un moniteur comptent comme expérience attestée,
  // contrairement au carnet qui liste aussi les plongées non encore
  // validées.
  async getAttestationSuiviPdf(req, res, next) {
    try {
      const { num_adherent } = req.params;
      const plongees = await this.plongeeService.getPlongeesByAdherent(num_adherent, req.user);
      const adherent = await identiteClient.getAdherentById(num_adherent, req.headers.authorization);
      if (!adherent) {
        return res.status(404).json({ success: false, message: 'Adhérent non trouvé' });
      }
      const validees = plongees.filter((p) => p.id_moniteur_validateur);
      const profondeurMax = validees.length
        ? validees.reduce((max, p) => Math.max(max, p.profondeur_max || 0), 0)
        : null;
      const dates = validees.map((p) => new Date(p.date)).sort((a, b) => a - b);
      await streamAttestationSuiviPlongee(res, {
        adherent,
        nbPlongees: validees.length,
        profondeurMax,
        dateDebut: dates[0] || null,
        dateFin: dates[dates.length - 1] || null,
      });
    } catch (error) {
      next(withStatus(error, 403));
    }
  }

  async getWithDetails(req, res, next) {
    try {
      const result = await this.plongeeService.getPlongeeWithDetails(req.params.id, req.user, req.headers.authorization);
      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Plongée non trouvée'
        });
      }
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(withStatus(error, 403));
    }
  }

  async getStats(req, res, next) {
    try {
      const stats = await this.plongeeService.getPlongeeStats();
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async getNbInactifs(req, res, next) {
    try {
      const inactifs = await this.plongeeService.getInactifs();
      res.json({ success: true, data: { nbInactifs: inactifs.length } });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async getTrend(req, res, next) {
    try {
      const trend = await this.plongeeService.getTrend();
      res.json({ success: true, data: trend });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async getByDateRange(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Les dates de début et de fin sont requises'
        });
      }
      const results = await this.plongeeService.getPlongeesByDateRange(
        new Date(startDate),
        new Date(endDate)
      );
      res.json({
        success: true,
        data: results,
        count: results.length
      });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  // Moniteur vit dans identite-service : résolu par HTTP au lieu d'un
  // `Moniteur.findOne` local.
  async validatePlongee(req, res, next) {
    try {
      let id_moniteur = req.body.id_moniteur;
      if (!id_moniteur && req.user?.id) {
        const moniteur = await identiteClient.getMoniteurByUserId(req.user.id);
        id_moniteur = moniteur?.id_moniteur;
      }
      const result = await this.plongeeService.validatePlongee(
        req.params.id,
        id_moniteur,
        req.headers.authorization,
      );
      res.json({
        success: true,
        data: result,
        message: 'Plongée validée avec succès'
      });
    } catch (error) {
      next(withStatus(error, 400));
    }
  }

  async validateBeforeCreate(req, res, next) {
    const errors = await this.plongeeService.validatePlongeeData(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors
      });
    }
    next();
  }
}

module.exports = PlongeeController;
