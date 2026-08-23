const BaseController = require("./BaseController");
const AdherentService = require("../services/AdherentService");
const { withStatus } = require("../utils/errors");
const { friendlyUniqueConstraintMessage } = require("../utils/uniqueConstraintMessage");

class AdherentController extends BaseController {
  constructor() {
    const service = new AdherentService();
    super(service);
    this.adherentService = service;
  }

  async getAll(req, res, next) {
    try {
      const results = await this.adherentService.getAll(req.user);
      res.json({
        success: true,
        data: results,
        message: "Opération réussie",
      });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async sendCommunication(req, res, next) {
    try {
      const { niveau, ancienneteMinAnnees, subject, message } = req.body;
      const result = await this.adherentService.sendCommunication({
        niveau,
        ancienneteMinAnnees,
        subject,
        message,
      });
      res.json({
        success: true,
        data: result,
        message: `Message envoyé à ${result.sent}/${result.matched} adhérent(s)`,
      });
    } catch (error) {
      next(withStatus(error, 400));
    }
  }

  async getById(req, res, next) {
    try {
      const result = await this.adherentService.getById(
        req.params.id,
        req.user,
        req.headers.authorization,
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
      next(withStatus(error, 403));
    }
  }

  async getWithDetails(req, res, next) {
    try {
      const result = await this.adherentService.getAdherentWithDetails(
        req.params.id,
        req.user,
        req.headers.authorization,
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
      next(withStatus(error, 403));
    }
  }

  // Endpoint interne, appelé par finance-service/vie-associative-service
  // (identiteClient) pour résoudre l'adhérent scopé à un utilisateur — même
  // contrat public que `GET /tresoriers/user/:user_id`.
  async getByUserId(req, res, next) {
    try {
      const { user_id } = req.params;
      const result = await this.adherentService.getByUserId(user_id);
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
      next(withStatus(error, 500));
    }
  }

  async getActiveAdherents(req, res, next) {
    try {
      const results = await this.adherentService.getActiveAdherents();
      res.json({
        success: true,
        data: results,
        count: results.length,
      });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async getWithExpiringCertificates(req, res, next) {
    try {
      const results =
        await this.adherentService.getAdherentsWithExpiringCertificates();
      res.json({
        success: true,
        data: results,
        count: results.length,
      });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async getByEmail(req, res, next) {
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
      next(withStatus(error, 500));
    }
  }

  async getByNiveau(req, res, next) {
    try {
      const { niveau } = req.params;
      const results = await this.adherentService.getAdherentsByNiveau(niveau);
      res.json({
        success: true,
        data: results,
        count: results.length,
      });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async search(req, res, next) {
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
      next(withStatus(error, 500));
    }
  }

  async getStats(req, res, next) {
    try {
      const stats = await this.adherentService.getAdherentStats();
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
      const trend = await this.adherentService.getTrend();
      res.json({ success: true, data: trend });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async create(req, res, next) {
    try {
      const validatedData = this.adherentService.validateDates(req.body);
      if (req.user?.id) {
        validatedData.created_by = req.user.id;
      }

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
      next(withStatus(error, 400));
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;

      const validatedData = this.adherentService.validateDates(req.body);

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
      if (error.name === "SequelizeUniqueConstraintError") {
        return res.status(400).json({
          success: false,
          message: friendlyUniqueConstraintMessage(error),
        });
      }
      next(withStatus(error, 400));
    }
  }

  async delete(req, res, next) {
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
      next(withStatus(error, 500));
    }
  }

  async incrementPlongees(req, res, next) {
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
      next(withStatus(error, 500));
    }
  }

  async updateNiveau(req, res, next) {
    try {
      const { niveau, num_brevet, num_licence_ffesm } = req.body;
      if (!niveau) {
        return res.status(400).json({
          success: false,
          message: "Le niveau est requis",
        });
      }
      const result = await this.adherentService.updateNiveau(
        req.params.id,
        niveau,
        { num_brevet, num_licence_ffesm },
      );
      res.json({
        success: true,
        data: result,
        message: "Niveau mis à jour avec succès",
      });
    } catch (error) {
      if (error.name === "SequelizeUniqueConstraintError") {
        return res.status(400).json({
          success: false,
          message: friendlyUniqueConstraintMessage(error),
        });
      }
      next(withStatus(error, 500));
    }
  }

  // Appelé par formation-service (identiteClient.syncStatutFormation) à
  // chaque création/clôture/ajournement/suppression de formation — voir
  // AdherentService.syncStatutFormation pour la règle appliquée.
  async syncStatutFormation(req, res, next) {
    try {
      const { enFormation } = req.body;
      const result = await this.adherentService.syncStatutFormation(
        req.params.id,
        Boolean(enFormation),
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
        message: "Statut formation synchronisé",
      });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  // Route de maintenance ponctuelle (voir adherentRoutes.js) : applique
  // scripts/backfill-adherent-statut-formation.sql depuis le service
  // lui-même (voir AdherentService.runStatutFormationBackfill).
  async backfillStatutFormation(req, res, next) {
    try {
      const result = await this.adherentService.runStatutFormationBackfill();
      res.json({ success: true, data: result, message: "Backfill appliqué avec succès" });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

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
      next(withStatus(error, 500));
    }
  }

  async validateBeforeUpdate(req, res, next) {
    try {
      const data = { ...req.body, num_adherent: req.params.id };
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
      next(withStatus(error, 500));
    }
  }
}

module.exports = AdherentController;
