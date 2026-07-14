const BaseController = require("./BaseController");
const PaiementService = require("../services/PaiementService");
const { Adherent } = require("../models");
const { streamRecuPaiement } = require("../utils/pdf");

class PaiementController extends BaseController {
  constructor() {
    const service = new PaiementService();
    super(service);
    this.paiementService = service;
  }

  async create(req, res) {
    try {
      const result = await this.paiementService.create(req.body, req.user);
      res.status(201).json({
        success: true,
        data: result,
        message: "Paiement créé avec succès",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getAll(req, res) {
    try {
      const results = await this.paiementService.getAll(req.user);
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
      const result = await this.paiementService.getById(req.params.id, req.user);
      if (!result) {
        return res.status(404).json({
          success: false,
          message: "Paiement non trouvé",
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
        num_adherent,
        req.user,
      );
      res.json({
        success: true,
        data: results,
        count: results.length,
      });
    } catch (error) {
      res.status(403).json({
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

  async getRecu(req, res) {
    try {
      const paiement = await this.paiementService.getById(req.params.id, req.user);
      if (!paiement) {
        return res.status(404).json({ success: false, message: "Paiement non trouvé" });
      }
      const adherent = await Adherent.findByPk(paiement.num_adherent);
      const libelles = {
        Adhesion: `Adhésion — réf. #${paiement.reference_id}`,
        Caution: `Caution matériel — prêt #${paiement.reference_id}`,
      };
      await streamRecuPaiement(res, {
        paiement,
        adherent,
        libelleReference: libelles[paiement.type_paiement] || paiement.type_paiement,
      });
    } catch (error) {
      res.status(403).json({
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
