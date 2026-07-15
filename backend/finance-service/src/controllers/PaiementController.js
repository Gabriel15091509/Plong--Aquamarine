const BaseController = require("./BaseController");
const PaiementService = require("../services/PaiementService");
const identiteClient = require("../utils/serviceClients/identiteClient");
const { streamRecuPaiement } = require("../utils/pdf");
const { withStatus } = require("../utils/errors");

class PaiementController extends BaseController {
  constructor() {
    const service = new PaiementService();
    super(service);
    this.paiementService = service;
  }

  async create(req, res, next) {
    try {
      const result = await this.paiementService.create(
        req.body,
        req.user,
        req.headers.authorization,
      );
      res.status(201).json({
        success: true,
        data: result,
        message: "Paiement créé avec succès",
      });
    } catch (error) {
      next(withStatus(error, 400));
    }
  }

  // Endpoint interne, appelé par les services propriétaires d'un objet
  // payant (formation-service, materiel-service, monolithe pour Adhesion/
  // Sortie/Caution) pour enregistrer leur ligne Paiement liée sans dupliquer
  // la logique de dé-duplication — voir
  // PaiementService.createLinkedPaymentFromRemote.
  async createLinked(req, res, next) {
    try {
      const { paiement, isDuplicate } =
        await this.paiementService.createLinkedPaymentFromRemote(req.body);
      res.status(201).json({
        success: true,
        data: paiement,
        isDuplicate,
      });
    } catch (error) {
      next(withStatus(error, 400));
    }
  }

  // Endpoint interne, appelé par le monolithe (AttributionService.restituerCaution)
  // via paiementClient.marquerRembourse.
  async marquerRembourse(req, res, next) {
    try {
      const { type_paiement, reference_id } = req.body;
      const result = await this.paiementService.marquerRembourseParReference(
        type_paiement,
        reference_id,
      );
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(withStatus(error, 400));
    }
  }

  async getAll(req, res, next) {
    try {
      const results = await this.paiementService.getAll(req.user);
      res.json({
        success: true,
        data: results,
        message: "Opération réussie",
      });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async getById(req, res, next) {
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
      next(withStatus(error, 403));
    }
  }

  async getPendingPayments(req, res, next) {
    try {
      const results = await this.paiementService.getPendingPayments();
      res.json({
        success: true,
        data: results,
        count: results.length,
      });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async getByAdherent(req, res, next) {
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
      next(withStatus(error, 403));
    }
  }

  async getStats(req, res, next) {
    try {
      const stats = await this.paiementService.getPaymentStats();
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
      const trend = await this.paiementService.getTrend();
      res.json({
        success: true,
        data: trend,
      });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async getTotalByPeriod(req, res, next) {
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
      next(withStatus(error, 500));
    }
  }

  async processPayment(req, res, next) {
    try {
      const result = await this.paiementService.processPayment(req.params.id);
      res.json({
        success: true,
        data: result,
        message: "Paiement validé avec succès",
      });
    } catch (error) {
      next(withStatus(error, 400));
    }
  }

  async cancelPayment(req, res, next) {
    try {
      const result = await this.paiementService.cancelPayment(req.params.id);
      res.json({
        success: true,
        data: result,
        message: "Paiement annulé avec succès",
      });
    } catch (error) {
      next(withStatus(error, 400));
    }
  }

  // L'adhérent (civilité/nom/prénom) n'appartient plus à ce process : récupéré
  // via identite-service au lieu d'un `Adherent.findByPk` local.
  async getRecu(req, res, next) {
    try {
      const paiement = await this.paiementService.getById(req.params.id, req.user);
      if (!paiement) {
        return res.status(404).json({ success: false, message: "Paiement non trouvé" });
      }
      const adherent = await identiteClient.getAdherentById(paiement.num_adherent, req.headers.authorization);
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
      next(withStatus(error, 403));
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
