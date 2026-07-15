const { withStatus } = require("../utils/errors");

class BaseController {
  constructor(service) {
    this.service = service;
  }

  async getAll(req, res, next) {
    try {
      const results = await this.service.getAll(req.query);
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
      const result = await this.service.getById(req.params.id);
      if (!result) {
        return res.status(404).json({
          success: false,
          message: "Élément non trouvé",
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
      const result = await this.service.create(req.body);
      res.status(201).json({
        success: true,
        data: result,
        message: "Créé avec succès",
      });
    } catch (error) {
      next(withStatus(error, 400));
    }
  }

  async update(req, res, next) {
    try {
      const result = await this.service.update(req.params.id, req.body);
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
      await this.service.delete(req.params.id);
      res.json({
        success: true,
        message: "Supprimé avec succès",
      });
    } catch (error) {
      next(withStatus(error, 400));
    }
  }
}

module.exports = BaseController;
