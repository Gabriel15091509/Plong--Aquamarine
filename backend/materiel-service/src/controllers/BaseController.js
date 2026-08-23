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

  // Suppression groupée : { ids: [...] } dans le corps de la requête —
  // voir BaseService.bulkDelete pour le comportement (résultat détaillé
  // par id, jamais tout-ou-rien).
  async bulkDelete(req, res, next) {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Le champ ids (tableau non vide) est requis",
        });
      }
      const results = await this.service.bulkDelete(ids, req.user, req.headers.authorization);
      const failed = results.filter((r) => !r.success);
      res.json({
        success: failed.length === 0,
        data: results,
        message:
          failed.length === 0
            ? `${results.length} élément(s) supprimé(s) avec succès`
            : `${results.length - failed.length}/${results.length} supprimé(s), ${failed.length} échec(s)`,
      });
    } catch (error) {
      next(withStatus(error, 400));
    }
  }
}

module.exports = BaseController;
