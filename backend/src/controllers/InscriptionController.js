const BaseController = require("./BaseController");
const InscriptionService = require("../services/InscriptionService");

class InscriptionController extends BaseController {
  constructor() {
    const service = new InscriptionService();
    super(service);
    this.inscriptionService = service;
  }

  // ✅ GET - Récupérer toutes les inscriptions
  async getAll(req, res) {
    try {
      const results = await this.inscriptionService.getAll(req.user);
      res.json({
        success: true,
        data: results || [],
        count: results?.length || 0,
      });
    } catch (error) {
      console.error("Erreur getAll:", error);
      res.status(500).json({
        success: false,
        message: error.message,
        data: [],
      });
    }
  }

  // ✅ GET - Récupérer une inscription par ID
  async getById(req, res) {
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
      console.error("Erreur getById:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // ✅ POST - Créer une inscription
  async createInscription(req, res) {
    try {
      const data = req.body;
      console.log(
        "📝 POST /inscriptions - Body reçu:",
        JSON.stringify(data, null, 2),
      );

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
      });

      res.status(201).json({
        success: true,
        data: result,
        message: "Inscription créée avec succès",
      });
    } catch (error) {
      console.error("❌ Erreur createInscription:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Erreur lors de la création",
      });
    }
  }

  // ✅ PUT - Mettre à jour une inscription
  async update(req, res) {
    try {
      const { id } = req.params;
      const data = req.body;

      console.log("📝 PUT /inscriptions/:id - ID:", id, "Data:", data);

      const cleanData = this.cleanInscriptionData(data);
      cleanData.role = req.user?.role || data.role;
      cleanData.user = req.user;
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
      console.error("❌ Erreur update inscription:", error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // ✅ POST - Enregistrer un paiement (acompte/solde) sur le tarif de la sortie
  async enregistrerPaiement(req, res) {
    try {
      const { id } = req.params;
      const result = await this.inscriptionService.enregistrerPaiement(
        parseInt(id),
        req.body,
        req.user,
      );
      res.json({
        success: true,
        data: result,
        message: "Paiement enregistré avec succès",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // ✅ DELETE - Supprimer une inscription
  async delete(req, res) {
    try {
      const { id } = req.params;
      await this.inscriptionService.delete(parseInt(id), req.user);
      res.json({
        success: true,
        message: "Inscription supprimée avec succès",
      });
    } catch (error) {
      console.error("Erreur delete:", error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // ✅ PATCH - Confirmer une inscription
  async confirmInscription(req, res) {
    try {
      const { id } = req.params;
      const result = await this.inscriptionService.confirmInscription(
        parseInt(id),
        req.user,
      );
      res.json({
        success: true,
        data: result,
        message: "Inscription confirmée avec succès",
      });
    } catch (error) {
      console.error("Erreur confirmInscription:", error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // ✅ PATCH - Annuler une inscription
  async cancelInscription(req, res) {
    try {
      const { id } = req.params;
      const result = await this.inscriptionService.cancelInscription(
        parseInt(id),
        req.user,
      );
      res.json({
        success: true,
        data: result,
        message: "Inscription annulée avec succès",
      });
    } catch (error) {
      console.error("Erreur cancelInscription:", error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // ✅ GET - Récupérer les confirmations par sortie
  async getBySortie(req, res) {
    try {
      const { id_sortie } = req.params;
      const results = await this.inscriptionService.getConfirmationsBySortie(
        parseInt(id_sortie),
        req.user,
        req.query.presents === "true",
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

  // ✅ GET - Récupérer la liste d'attente par sortie
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

  // ✅ GET - Récupérer une inscription par adhérent et sortie
  // ✅ GET - Capacité et occupation d'une sortie
  async getCapacity(req, res) {
    try {
      const { id_sortie } = req.params;
      const result = await this.inscriptionService.getCapacityBySortie(
        parseInt(id_sortie),
      );
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Erreur getCapacity:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
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

  async getByAdherentAndSortie(req, res) {
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
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // ✅ GET - Statistiques des inscriptions
  async getStats(req, res) {
    try {
      const stats = await this.inscriptionService.getInscriptionStats(req.user);
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Erreur getStats:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // ✅ Nettoyer les données
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
