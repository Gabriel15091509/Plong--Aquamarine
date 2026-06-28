const BaseController = require('./BaseController');
const AlerteService = require('../services/AlerteService');

class AlerteController extends BaseController {
  constructor() {
    const service = new AlerteService();
    super(service);
    this.alerteService = service;
  }

  async getUnread(req, res) {
    try {
      const results = await this.alerteService.getUnread();
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
      const results = await this.alerteService.getByAdherent(parseInt(num_adherent));
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
      const result = await this.alerteService.markAsRead(id);
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
      const result = await this.alerteService.markAllAsRead();
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
      const stats = await this.alerteService.getStats();
      const unreadCount = await this.alerteService.getUnreadCount();
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

  async create(req, res) {
    try {
      const errors = await this.alerteService.validateAlerteData(req.body);
      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          errors
        });
      }

      const result = await this.alerteService.createAlerte(req.body);
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
    const errors = await this.alerteService.validateAlerteData(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors
      });
    }
    next();
  }
}

module.exports = AlerteController;