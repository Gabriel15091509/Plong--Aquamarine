const BaseController = require('./BaseController');
const AlerteService = require('../services/AlerteService');

class AlerteController extends BaseController {
  constructor() {
    const service = new AlerteService();
    super(service);
    this.alerteService = service;
  }

  async getAll(req, res) {
    try {
      const results = await this.alerteService.getAll(req.query, req.user);
      res.json({
        success: true,
        data: results,
        count: results.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getUnread(req, res) {
    try {
      const results = await this.alerteService.getUnread(req.user);
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
      const results = await this.alerteService.getByAdherent(
        parseInt(num_adherent),
        req.user
      );
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

  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const result = await this.alerteService.markAsRead(id, req.user);
      res.json({
        success: true,
        data: result,
        message: 'Alerte marquée comme lue'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async markAllAsRead(req, res) {
    try {
      const result = await this.alerteService.markAllAsRead(req.user);
      res.json({
        success: true,
        data: result,
        message: 'Toutes les alertes marquées comme lues'
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
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const alertes = await this.alerteService.getAll({}, req.user);
      const result = alertes.find(
        (alerte) => alerte.id_alerte === parseInt(id)
      );

      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Alerte non trouvée'
        });
      }

      res.json({
        success: true,
        data: result
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

      const result = await this.alerteService.createAlerte(data);
      res.status(201).json({
        success: true,
        data: result,
        message: 'Alerte créée avec succès'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
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

  async delete(req, res) {
    try {
      const { id } = req.params;
      const result = await this.alerteService.markAsRead(id, req.user);
      await result.destroy();
      res.json({
        success: true,
        message: 'Alerte supprimée'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = AlerteController;
