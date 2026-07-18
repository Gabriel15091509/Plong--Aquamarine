const BaseController = require("./BaseController");
const EcheancierService = require("../services/EcheancierService");
const { withStatus } = require("../utils/errors");

class EcheancierController extends BaseController {
  constructor() {
    const service = new EcheancierService();
    super(service);
    this.echeancierService = service;
  }

  async create(req, res, next) {
    try {
      const result = await this.echeancierService.create(req.body, req.user, req.headers.authorization);
      res.status(201).json({
        success: true,
        data: result,
        message: "Échéancier créé avec succès",
      });
    } catch (error) {
      next(withStatus(error, 400));
    }
  }

  async getByReference(req, res, next) {
    try {
      const { type_paiement, reference_id } = req.query;
      if (!type_paiement || !reference_id) {
        return res.status(400).json({
          success: false,
          message: "type_paiement et reference_id sont requis",
        });
      }
      const results = await this.echeancierService.getByReference(type_paiement, reference_id);
      res.json({ success: true, data: results });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async getByAdherent(req, res, next) {
    try {
      const results = await this.echeancierService.getByAdherent(req.params.num_adherent);
      res.json({ success: true, data: results });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async payerEcheance(req, res, next) {
    try {
      const result = await this.echeancierService.payerEcheance(
        req.params.id,
        req.body,
        req.user,
        req.headers.authorization,
      );
      res.json({
        success: true,
        data: result,
        message: "Échéance réglée avec succès",
      });
    } catch (error) {
      next(withStatus(error, 400));
    }
  }
}

module.exports = EcheancierController;
