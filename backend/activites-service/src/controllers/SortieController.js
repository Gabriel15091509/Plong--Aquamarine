const BaseController = require("./BaseController");
const SortieService = require("../services/SortieService");
const { withStatus } = require("../utils/errors");

class SortieController extends BaseController {
  constructor() {
    const service = new SortieService();
    super(service);
    this.sortieService = service;
  }

  async getAll(req, res, next) {
    try {
      const results = await this.sortieService.getAll(req.user);
      res.json({
        success: true,
        data: results,
        count: results.length,
      });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async getUpcomingSorties(req, res, next) {
    try {
      const results = await this.sortieService.getUpcomingSorties(req.user);
      res.json({
        success: true,
        data: results,
        count: results.length,
      });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async getSortiesWithInscriptions(req, res, next) {
    try {
      const results = await this.sortieService.getSortiesWithInscriptions(req.headers.authorization);
      res.json({
        success: true,
        data: results,
        count: results.length,
      });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async getAvailablePlaces(req, res, next) {
    try {
      const results = await this.sortieService.getAvailablePlaces();
      res.json({
        success: true,
        data: results,
      });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async getStats(req, res, next) {
    try {
      const stats = await this.sortieService.getSortieStats();
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async getTrend(req, res, next) {
    try {
      const trend = await this.sortieService.getTrend();
      res.json({ success: true, data: trend });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async getSortieDetails(req, res, next) {
    try {
      const { id } = req.params;
      const result = await this.sortieService.getSortieDetails(parseInt(id), req.headers.authorization);

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
      next(withStatus(error, 500));
    }
  }

  async getPointage(req, res, next) {
    try {
      const { id } = req.params;
      const result = await this.sortieService.getPointageBySortie(parseInt(id), req.headers.authorization);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: "Sortie non trouvée",
        });
      }

      res.json({
        success: true,
        data: result,
        stats: this.sortieService.computePointageStats(result),
      });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async enregistrerPointage(req, res, next) {
    try {
      const { id } = req.params;
      const { inscriptions } = req.body;
      const userId = req.user.id;

      const result = await this.sortieService.enregistrerPointage(
        parseInt(id),
        inscriptions,
        userId,
        req.headers.authorization,
      );

      res.json({
        success: true,
        data: result,
        message: "Pointage enregistré avec succès",
      });
    } catch (error) {
      console.error("Erreur enregistrement pointage:", error);
      next(withStatus(error, 400));
    }
  }

  async modifierPointage(req, res, next) {
    try {
      const { id_inscription } = req.params;
      const data = req.body;
      const userId = req.user.id;

      const result = await this.sortieService.modifierPointage(
        parseInt(id_inscription),
        data,
        userId,
      );

      res.json({
        success: true,
        data: result,
        message: "Pointage modifié avec succès",
      });
    } catch (error) {
      console.error("Erreur modification pointage:", error);
      next(withStatus(error, 400));
    }
  }

  async annulerPointage(req, res, next) {
    try {
      const { id_inscription } = req.params;
      const userId = req.user.id;

      const result = await this.sortieService.annulerPointage(
        parseInt(id_inscription),
        userId,
      );

      res.json({
        success: true,
        data: result,
        message: "Pointage annulé avec succès",
      });
    } catch (error) {
      console.error("Erreur annulation pointage:", error);
      next(withStatus(error, 400));
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const result = await this.sortieService.getById(parseInt(id));

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
      next(withStatus(error, 500));
    }
  }

  async create(req, res, next) {
    try {
      const result = await this.sortieService.create(req.body);
      res.status(201).json({
        success: true,
        data: result,
        message: "Sortie créée avec succès",
      });
    } catch (error) {
      next(withStatus(error, 400));
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const result = await this.sortieService.update(parseInt(id), req.body);
      res.json({
        success: true,
        data: result,
        message: "Sortie mise à jour avec succès",
      });
    } catch (error) {
      next(withStatus(error, 400));
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await this.sortieService.delete(parseInt(id));
      res.json({
        success: true,
        message: "Sortie supprimée avec succès",
      });
    } catch (error) {
      next(withStatus(error, 400));
    }
  }

  async validateBeforeCreate(req, res, next) {
    try {
      const errors = await this.sortieService.validateSortieData(req.body);
      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          errors,
        });
      }
      next();
    } catch (error) {
      next(withStatus(error, 500));
    }
  }
}

module.exports = SortieController;
