const BaseController = require("./BaseController");
const MaterielService = require("../services/MaterielService");
const { withStatus } = require("../utils/errors");

class MaterielController extends BaseController {
  constructor() {
    const service = new MaterielService();
    super(service);
    this.materielService = service;
  }

  // BaseController.getById/update/delete lisent req.params.id — mais la clé
  // primaire de Materiel est une clé métier (num_inventaire), et les routes
  // (materielRoutes.js) utilisent donc `:num_inventaire`, pas `:id`. Sans ces
  // overrides, req.params.id est toujours undefined : la fiche, la
  // modification et la suppression d'un matériel échouaient silencieusement
  // (404 "Élément non trouvé") pour toute pièce existante.
  async getById(req, res, next) {
    try {
      const result = await this.materielService.getById(req.params.num_inventaire);
      if (!result) {
        return res.status(404).json({
          success: false,
          message: "Élément non trouvé",
        });
      }
      res.json({ success: true, data: result });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async update(req, res, next) {
    try {
      const result = await this.materielService.update(req.params.num_inventaire, req.body);
      res.json({
        success: true,
        data: result,
        message: "Mis à jour avec succès",
      });
    } catch (error) {
      next(withStatus(error, 400));
    }
  }

  async delete(req, res, next) {
    try {
      await this.materielService.delete(req.params.num_inventaire);
      res.json({ success: true, message: "Supprimé avec succès" });
    } catch (error) {
      next(withStatus(error, 400));
    }
  }

  async getAvailableMateriel(req, res, next) {
    try {
      const results = await this.materielService.getAvailableMateriel();
      res.json({
        success: true,
        data: results,
        count: results.length,
      });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async getNeedingMaintenance(req, res, next) {
    try {
      const results =
        await this.materielService.getMaterielNeedingMaintenance();
      res.json({
        success: true,
        data: results,
        count: results.length,
      });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async getWithReparations(req, res, next) {
    try {
      const results = await this.materielService.getMaterielWithReparations();
      res.json({
        success: true,
        data: results,
        count: results.length,
      });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async getStats(req, res, next) {
    try {
      const stats = await this.materielService.getMaterielStats();
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
      const trend = await this.materielService.getTrend();
      res.json({
        success: true,
        data: trend,
      });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async updateEtat(req, res, next) {
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
      next(withStatus(error, 400));
    }
  }

  async updateLocalisation(req, res, next) {
    try {
      const { num_inventaire } = req.params;
      const { localisation } = req.body;
      const result = await this.materielService.updateLocalisation(
        num_inventaire,
        localisation,
      );
      res.json({
        success: true,
        data: result,
        message: "Localisation mise à jour avec succès",
      });
    } catch (error) {
      next(withStatus(error, 400));
    }
  }

  async updatePhoto(req, res, next) {
    try {
      const { num_inventaire } = req.params;
      const { photo_path } = req.body;
      const result = await this.materielService.updatePhoto(
        num_inventaire,
        photo_path,
      );
      res.json({
        success: true,
        data: result,
        message: "Photo mise à jour avec succès",
      });
    } catch (error) {
      next(withStatus(error, 400));
    }
  }

  async checkAvailability(req, res, next) {
    try {
      const { num_inventaire } = req.params;
      const available =
        await this.materielService.checkAvailability(num_inventaire);
      res.json({
        success: true,
        data: { available },
      });
    } catch (error) {
      next(withStatus(error, 500));
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
