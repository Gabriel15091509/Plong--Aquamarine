const BaseController = require('./BaseController');
const AlerteService = require('../services/AlerteService');
const { withStatus } = require('../utils/errors');

class AlerteController extends BaseController {
  constructor() {
    const service = new AlerteService();
    super(service);
    this.alerteService = service;
  }

  async getAll(req, res, next) {
    try {
      const results = await this.alerteService.getAll(req.query, req.user, req.headers.authorization);
      res.json({
        success: true,
        data: results,
        count: results.length,
      });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async getUnread(req, res, next) {
    try {
      const results = await this.alerteService.getUnread(req.user, req.headers.authorization);
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
      const results = await this.alerteService.getByAdherent(
        num_adherent,
        req.user,
        req.headers.authorization
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

  async markAsRead(req, res, next) {
    try {
      const { id } = req.params;
      const result = await this.alerteService.markAsRead(id, req.user);
      res.json({
        success: true,
        data: result,
        message: 'Alerte marquée comme lue'
      });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async markAllAsRead(req, res, next) {
    try {
      const result = await this.alerteService.markAllAsRead(req.user);
      res.json({
        success: true,
        data: result,
        message: 'Toutes les alertes marquées comme lues'
      });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async getStats(req, res, next) {
    try {
      const stats = await this.alerteService.getStats(req.user);
      const unreadCount = await this.alerteService.getUnreadCount(req.user);
      res.json({
        success: true,
        data: {
          stats,
          unreadCount
        }
      });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const result = await this.alerteService.getByIdForUser(id, req.user, req.headers.authorization);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(withStatus(error, 404));
    }
  }

  async relancer(req, res, next) {
    try {
      const { id } = req.params;
      const result = await this.alerteService.relancerParEmail(id, req.user, req.headers.authorization);
      res.json({
        success: true,
        data: result,
        message: 'Relance envoyée par email'
      });
    } catch (error) {
      next(withStatus(error, 400));
    }
  }

  async relancerSms(req, res, next) {
    try {
      const { id } = req.params;
      const result = await this.alerteService.relancerParSms(id, req.user, req.headers.authorization);
      res.json({
        success: true,
        data: result,
        message: 'Relance envoyée par SMS'
      });
    } catch (error) {
      next(withStatus(error, 400));
    }
  }

  async create(req, res, next) {
    try {
      const data = { ...req.body };
      const scope = await this.alerteService.getScopeForUser(req.user);
      if (scope.num_adherent) {
        data.num_adherent = scope.num_adherent;
      }

      const errors = await this.alerteService.validateAlerteData(data);
      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          errors
        });
      }

      const result = await this.alerteService.createAlerte(data, req.headers.authorization);
      res.status(201).json({
        success: true,
        data: result,
        message: 'Alerte créée avec succès'
      });
    } catch (error) {
      next(withStatus(error, 400));
    }
  }

  async validateBeforeCreate(req, res, next) {
    const data = { ...req.body };
    const scope = await this.alerteService.getScopeForUser(req.user);
    if (scope.num_adherent) {
      data.num_adherent = scope.num_adherent;
    }
    const errors = await this.alerteService.validateAlerteData(data);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors
      });
    }
    next();
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const result = await this.alerteService.markAsRead(id, req.user);
      await result.destroy();
      res.json({
        success: true,
        message: 'Alerte supprimée'
      });
    } catch (error) {
      next(withStatus(error, 400));
    }
  }
}

module.exports = AlerteController;
