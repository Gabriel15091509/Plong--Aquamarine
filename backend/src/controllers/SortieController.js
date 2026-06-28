const BaseController = require("./BaseController");
const SortieService = require("../services/SortieService");

class SortieController extends BaseController {
  constructor() {
    const service = new SortieService();
    super(service);
    this.sortieService = service;
  }

  async getUpcomingSorties(req, res) {
    try {
      const results = await this.sortieService.getUpcomingSorties();
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

  async getSortiesWithInscriptions(req, res) {
    try {
      const results = await this.sortieService.getSortiesWithInscriptions();
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

  async getAvailablePlaces(req, res) {
    try {
      const results = await this.sortieService.getAvailablePlaces();
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
      const stats = await this.sortieService.getSortieStats();
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

  async getSortieDetails(req, res) {
    try {
      const result = await this.sortieService.getSortieDetails(req.params.id);
      if (!result) {
        return res.status(404).json({
          success: false,
          message: "Sortie non trouvée",
        });
      }
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async validateBeforeCreate(req, res, next) {
    const errors = await this.sortieService.validateSortieData(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors,
      });
    }
    next();
  }
}

module.exports = SortieController;
