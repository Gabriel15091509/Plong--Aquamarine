const BaseController = require("./BaseController");
const InscriptionService = require("../services/InscriptionService");
const { withStatus } = require("../utils/errors");

class InscriptionController extends BaseController {
  constructor() {
    const service = new InscriptionService();
    super(service);
    this.inscriptionService = service;
  }

  async getAll(req, res) {
    try {
      const results = await this.inscriptionService.getAll(
        req.user,
        req.headers.authorization,
      );
      res.json({
        success: true,
        data: results || [],
        count: results?.length || 0,
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des inscriptions :", error);
      res.status(500).json({
        success: false,
        message: error.message,
        data: [],
      });
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const result = await this.inscriptionService.getById(
        parseInt(id),
        req.user,
      );

      if (!result) {
        return res.status(404).json({
          success: false,
          message: "Inscription non trouvée",
        });
      }

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error(`Erreur lors de la récupération de l'inscription ${req.params.id} :`, error);
      next(withStatus(error, 500));
    }
  }

  async createInscription(req, res, next) {
    try {
      const data = req.body;

      if (!data.num_adherent) {
        return res.status(400).json({
          success: false,
          message: "L'adhérent est requis",
        });
      }
      if (!data.id_sortie) {
        return res.status(400).json({
          success: false,
          message: "La sortie est requise",
        });
      }

      const result = await this.inscriptionService.createInscription({
        ...data,
        role: req.user?.role || data.role,
        user: req.user,
        authHeader: req.headers.authorization,
      });

      res.status(201).json({
        success: true,
        data: result,
        message: "Inscription créée avec succès",
      });
    } catch (error) {
      console.error("Erreur createInscription:", error);
      next(withStatus(error, 400));
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const data = req.body;

      const cleanData = this.cleanInscriptionData(data);
      cleanData.role = req.user?.role || data.role;
      cleanData.user = req.user;
      cleanData.authHeader = req.headers.authorization;
      const result = await this.inscriptionService.update(
        parseInt(id),
        cleanData,
      );

      res.json({
        success: true,
        data: result,
        message: "Inscription mise à jour avec succès",
      });
    } catch (error) {
      console.error("Erreur update inscription:", error);
      next(withStatus(error, 400));
    }
  }

  async enregistrerPaiement(req, res, next) {
    try {
      const { id } = req.params;
      const result = await this.inscriptionService.enregistrerPaiement(
        parseInt(id),
        req.body,
        req.user,
        req.headers.authorization,
      );
      res.json({
        success: true,
        data: result,
        message: "Paiement enregistré avec succès",
      });
    } catch (error) {
      next(withStatus(error, 400));
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      await this.inscriptionService.delete(parseInt(id), req.user, req.headers.authorization);
      res.json({
        success: true,
        message: "Inscription supprimée avec succès",
      });
    } catch (error) {
      console.error(`Erreur lors de la suppression de l'inscription ${req.params.id} :`, error);
      next(withStatus(error, 400));
    }
  }

  async confirmInscription(req, res, next) {
    try {
      const { id } = req.params;
      const result = await this.inscriptionService.confirmInscription(
        parseInt(id),
        req.user,
        req.headers.authorization,
      );
      res.json({
        success: true,
        data: result,
        message: "Inscription confirmée avec succès",
      });
    } catch (error) {
      console.error("Erreur confirmInscription:", error);
      next(withStatus(error, 400));
    }
  }

  async cancelInscription(req, res, next) {
    try {
      const { id } = req.params;
      const result = await this.inscriptionService.cancelInscription(
        parseInt(id),
        req.user,
        req.headers.authorization,
      );
      res.json({
        success: true,
        data: result,
        message: "Inscription annulée avec succès",
      });
    } catch (error) {
      console.error("Erreur cancelInscription:", error);
      next(withStatus(error, 400));
    }
  }

  async getBySortie(req, res) {
    try {
      const { id_sortie } = req.params;
      const results = await this.inscriptionService.getConfirmationsBySortie(
        parseInt(id_sortie),
        req.user,
        req.query.presents === "true",
        req.headers.authorization,
      );
      res.json({
        success: true,
        data: results || [],
        count: results?.length || 0,
      });
    } catch (error) {
      console.error("Erreur getBySortie:", error);
      res.status(500).json({
        success: false,
        message: error.message,
        data: [],
      });
    }
  }

  async getWaitlist(req, res) {
    try {
      const { id_sortie } = req.params;
      const results = await this.inscriptionService.getWaitlistBySortie(
        parseInt(id_sortie),
        req.user,
      );
      res.json({
        success: true,
        data: results || [],
        count: results?.length || 0,
      });
    } catch (error) {
      console.error("Erreur getWaitlist:", error);
      res.status(500).json({
        success: false,
        message: error.message,
        data: [],
      });
    }
  }

  async getCapacity(req, res, next) {
    try {
      const { id_sortie } = req.params;
      const result = await this.inscriptionService.getCapacityBySortie(
        parseInt(id_sortie),
        req.headers.authorization,
      );
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Erreur getCapacity:", error);
      next(withStatus(error, 500));
    }
  }

  async getByAdherent(req, res) {
    try {
      const { num_adherent } = req.params;
      const results = await this.inscriptionService.getByAdherent(num_adherent);
      res.json({
        success: true,
        data: results || [],
        count: results?.length || 0,
      });
    } catch (error) {
      console.error("Erreur getByAdherent:", error);
      res.status(500).json({
        success: false,
        message: error.message,
        data: [],
      });
    }
  }

  async getByAdherentAndSortie(req, res, next) {
    try {
      const { num_adherent, id_sortie } = req.params;
      const result = await this.inscriptionService.getByAdherentAndSortie(
        num_adherent,
        parseInt(id_sortie),
        req.user,
      );
      res.json({
        success: true,
        data: result || null,
      });
    } catch (error) {
      console.error("Erreur getByAdherentAndSortie:", error);
      next(withStatus(error, 500));
    }
  }

  async getStats(req, res, next) {
    try {
      const stats = await this.inscriptionService.getInscriptionStats(req.user);
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Erreur getStats:", error);
      next(withStatus(error, 500));
    }
  }

  cleanInscriptionData(data) {
    const cleanData = { ...data };

    if (cleanData.presence_check_time) {
      const date = new Date(cleanData.presence_check_time);
      if (!isNaN(date.getTime())) {
        cleanData.presence_check_time = date;
      } else {
        cleanData.presence_check_time = null;
      }
    }

    if (cleanData.presence_check_by) {
      cleanData.presence_check_by = parseInt(cleanData.presence_check_by);
    }

    if (cleanData.presence !== undefined) {
      cleanData.presence = Boolean(cleanData.presence);
    }

    if (cleanData.presence_checked !== undefined) {
      cleanData.presence_checked = Boolean(cleanData.presence_checked);
    }

    if (cleanData.rang_liste_attente !== undefined) {
      cleanData.rang_liste_attente = cleanData.rang_liste_attente
        ? parseInt(cleanData.rang_liste_attente)
        : null;
    }

    return cleanData;
  }

  async validateBeforeCreate(req, res, next) {
    const errors = await this.inscriptionService.validateInscriptionData(
      req.body,
    );
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors,
      });
    }
    next();
  }
}

module.exports = InscriptionController;
