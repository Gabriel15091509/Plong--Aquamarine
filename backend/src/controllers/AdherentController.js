const BaseController = require("./BaseController");
const AdherentService = require("../services/AdherentService");

class AdherentController extends BaseController {
  constructor() {
    const service = new AdherentService();
    super(service);
    this.adherentService = service;
  }

  // ============ MÉTHODES DE LECTURE ============

  async getWithDetails(req, res) {
    try {
      const result = await this.adherentService.getAdherentWithDetails(
        req.params.id,
      );
      if (!result) {
        return res.status(404).json({
          success: false,
          message: "Adhérent non trouvé",
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

  async getActiveAdherents(req, res) {
    try {
      const results = await this.adherentService.getActiveAdherents();
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

  async getWithExpiringCertificates(req, res) {
    try {
      const results =
        await this.adherentService.getAdherentsWithExpiringCertificates();
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

  async getByEmail(req, res) {
    try {
      const { email } = req.params;
      const result = await this.adherentService.getAdherentByEmail(email);
      if (!result) {
        return res.status(404).json({
          success: false,
          message: "Adhérent non trouvé",
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

  async getByNiveau(req, res) {
    try {
      const { niveau } = req.params;
      const results = await this.adherentService.getAdherentsByNiveau(niveau);
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

  async search(req, res) {
    try {
      const { q } = req.query;
      if (!q) {
        return res.status(400).json({
          success: false,
          message: "Le terme de recherche est requis",
        });
      }
      const results = await this.adherentService.searchAdherents(q);
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

  async getStats(req, res) {
    try {
      const stats = await this.adherentService.getAdherentStats();
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

  // ============ MÉTHODES DE CRÉATION ============

  async create(req, res) {
    try {
      // ✅ Validation des dates avant création
      const validatedData = this.validateDates(req.body);

      const result = await this.adherentService.create(validatedData);
      res.status(201).json({
        success: true,
        data: result,
        message: "Adhérent créé avec succès",
      });
    } catch (error) {
      if (error.name === "SequelizeValidationError") {
        return res.status(400).json({
          success: false,
          message: "Erreur de validation",
          errors: error.errors.map((e) => e.message),
        });
      }
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // ============ MÉTHODES DE MISE À JOUR ============

  async update(req, res) {
    try {
      const { id } = req.params;

      // ✅ Validation des dates avant mise à jour
      const validatedData = this.validateDates(req.body);

      const result = await this.adherentService.update(id, validatedData);
      res.json({
        success: true,
        data: result,
        message: "Adhérent mis à jour avec succès",
      });
    } catch (error) {
      if (error.message === "Entity not found") {
        return res.status(404).json({
          success: false,
          message: "Adhérent non trouvé",
        });
      }
      if (error.name === "SequelizeValidationError") {
        return res.status(400).json({
          success: false,
          message: "Erreur de validation",
          errors: error.errors.map((e) => e.message),
        });
      }
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // ============ MÉTHODES DE SUPPRESSION ============

  async delete(req, res) {
    try {
      const { id } = req.params;
      await this.adherentService.delete(id);
      res.json({
        success: true,
        message: "Adhérent supprimé avec succès",
      });
    } catch (error) {
      if (error.message === "Entity not found") {
        return res.status(404).json({
          success: false,
          message: "Adhérent non trouvé",
        });
      }
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // ============ MÉTHODES SPÉCIFIQUES ============

  async incrementPlongees(req, res) {
    try {
      const result = await this.adherentService.incrementPlongeesCount(
        req.params.id,
      );
      res.json({
        success: true,
        data: result,
        message: "Nombre de plongées incrémenté",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // ============ VALIDATION DES DATES ============

  validateDates(data) {
    const validated = { ...data };

    // Valider et formater la date de naissance
    if (validated.date_naissance) {
      const date = new Date(validated.date_naissance);
      if (isNaN(date.getTime())) {
        throw new Error("La date de naissance est invalide");
      }
      validated.date_naissance = date.toISOString();
    }

    // Valider et formater la date d'obtention du niveau
    if (validated.date_obtention_niveau) {
      const date = new Date(validated.date_obtention_niveau);
      if (isNaN(date.getTime())) {
        throw new Error("La date d'obtention du niveau est invalide");
      }
      validated.date_obtention_niveau = date.toISOString();
    }

    return validated;
  }

  // ============ VALIDATION AVANT CRÉATION/MISE À JOUR ============

  async validateBeforeCreate(req, res, next) {
    try {
      const errors = await this.adherentService.validateAdherentData(req.body);
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

  async validateBeforeUpdate(req, res, next) {
    try {
      const data = { ...req.body, num_adherent: parseInt(req.params.id) };
      const errors = await this.adherentService.validateAdherentData(
        data,
        true,
      );
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

module.exports = AdherentController;
