const BaseController = require('./BaseController');
const PlongeeService = require('../services/PlongeeService');
const identiteClient = require('../utils/serviceClients/identiteClient');
const { withStatus } = require('../utils/errors');

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
      res.json({
        success: true,
        data: results,
        count: results.length
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
