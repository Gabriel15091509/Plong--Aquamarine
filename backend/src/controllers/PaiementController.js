const BaseController = require("./BaseController");
const PaiementService = require("../services/PaiementService");

class PaiementController extends BaseController {
  constructor() {
    const service = new PaiementService();
    super(service);
    this.paiementService = service;
  }

  async getPendingPayments(req, res) {
    try {
      const results = await this.paiementService.getPendingPayments();
      res.json({
        success: true,
        data: results,
        count: results.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getByAdherent(req, res) {
    try {
      const { num_adherent } = req.params;
      const results = await this.paiementService.getPaymentsByAdherent(
        parseInt(num_adherent),
      );
      res.json({
        success: true,
        data: results,
        count: results.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // ✅ Ajout de getStats
  async getStats(req, res) {
    try {
      const stats = await this.paiementService.getPaymentStats();
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getTotalByPeriod(req, res) {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: "Les dates de début et de fin sont requises",
        });
      }
      const total = await this.paiementService.getTotalPaymentsByPeriod(
        new Date(startDate),
        new Date(endDate),
      );
      res.json({
        success: true,
        data: { total },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async processPayment(req, res) {
    try {
      const result = await this.paiementService.processPayment(req.params.id);
      res.json({
        success: true,
        data: result,
        message: "Paiement validé avec succès",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async cancelPayment(req, res) {
    try {
      const result = await this.paiementService.cancelPayment(req.params.id);
      res.json({
        success: true,
        data: result,
        message: "Paiement annulé avec succès",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async validateBeforeCreate(req, res, next) {
    const errors = await this.paiementService.validatePaymentData(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors,
      });
    }
    next();
  }
}

module.exports = PaiementController;
