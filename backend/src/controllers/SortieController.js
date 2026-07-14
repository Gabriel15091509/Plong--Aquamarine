const BaseController = require("./BaseController");
const SortieService = require("../services/SortieService");

class SortieController extends BaseController {
  constructor() {
    const service = new SortieService();
    super(service);
    this.sortieService = service;
  }

  // ✅ EXISTANT - Récupérer toutes les sorties
  async getAll(req, res) {
    try {
      const results = await this.sortieService.getAll(req.user);
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

  // ✅ EXISTANT - Récupérer les sorties à venir
  async getUpcomingSorties(req, res) {
    try {
      const results = await this.sortieService.getUpcomingSorties(req.user);
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

  // ✅ EXISTANT - Récupérer les sorties avec inscriptions
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

  // ✅ EXISTANT - Récupérer les places disponibles
  async getAvailablePlaces(req, res) {
    try {
      const results = await this.sortieService.getAvailablePlaces();
      res.json({
        success: true,
        data: results,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // ✅ EXISTANT - Statistiques
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

  // ✅ EXISTANT - Récupérer les détails d'une sortie
  async getSortieDetails(req, res) {
    try {
      const { id } = req.params;
      const result = await this.sortieService.getSortieDetails(parseInt(id));

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

  // ✅ NOUVEAU - Récupérer le pointage d'une sortie
  async getPointage(req, res) {
    try {
      const { id } = req.params;
      const result = await this.sortieService.getPointageBySortie(parseInt(id));

      if (!result) {
        return res.status(404).json({
          success: false,
          message: "Sortie non trouvée",
        });
      }

      res.json({
        success: true,
        data: result,
        stats: {
          total: result.inscriptions?.length || 0,
          present:
            result.inscriptions?.filter((i) => i.presence && i.presence_checked)
              .length || 0,
          absent:
            result.inscriptions?.filter(
              (i) => !i.presence && i.presence_checked,
            ).length || 0,
          notChecked:
            result.inscriptions?.filter((i) => !i.presence_checked).length || 0,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // ✅ NOUVEAU - Enregistrer le pointage
  async enregistrerPointage(req, res) {
    try {
      const { id } = req.params;
      const { inscriptions } = req.body; // Array d'IDs ou données de pointage
      const userId = req.user.id;

      const result = await this.sortieService.enregistrerPointage(
        parseInt(id),
        inscriptions,
        userId,
      );

      res.json({
        success: true,
        data: result,
        message: "Pointage enregistré avec succès",
      });
    } catch (error) {
      console.error("Erreur enregistrement pointage:", error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // ✅ NOUVEAU - Modifier un pointage
  async modifierPointage(req, res) {
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
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // ✅ NOUVEAU - Annuler un pointage
  async annulerPointage(req, res) {
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
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // ✅ EXISTANT - CRUD
  async getById(req, res) {
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
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async create(req, res) {
    try {
      const result = await this.sortieService.create(req.body);
      res.status(201).json({
        success: true,
        data: result,
        message: "Sortie créée avec succès",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const result = await this.sortieService.update(parseInt(id), req.body);
      res.json({
        success: true,
        data: result,
        message: "Sortie mise à jour avec succès",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      await this.sortieService.delete(parseInt(id));
      res.json({
        success: true,
        message: "Sortie supprimée avec succès",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
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
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = SortieController;
