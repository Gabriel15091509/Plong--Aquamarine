const BaseController = require("./BaseController");
const MaterielService = require("../services/MaterielService");

class MaterielController extends BaseController {
  constructor() {
    const service = new MaterielService();
    super(service);
    this.materielService = service;
  }

  async getAvailableMateriel(req, res) {
    try {
      const results = await this.materielService.getAvailableMateriel();
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

  async getNeedingMaintenance(req, res) {
    try {
      const results =
        await this.materielService.getMaterielNeedingMaintenance();
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

  async getWithReparations(req, res) {
    try {
      const results = await this.materielService.getMaterielWithReparations();
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
      const stats = await this.materielService.getMaterielStats();
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

  async updateEtat(req, res) {
    try {
      const { num_inventaire } = req.params;
      const { etat } = req.body;
      const result = await this.materielService.updateEtat(
        num_inventaire,
        etat,
      );
      res.json({
        success: true,
        data: result,
        message: "État mis à jour avec succès",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async checkAvailability(req, res) {
    try {
      const { num_inventaire } = req.params;
      const available =
        await this.materielService.checkAvailability(num_inventaire);
      res.json({
        success: true,
        data: { available },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async validateBeforeCreate(req, res, next) {
    const errors = await this.materielService.validateMaterielData(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors,
      });
    }
    next();
  }
}

module.exports = MaterielController;
