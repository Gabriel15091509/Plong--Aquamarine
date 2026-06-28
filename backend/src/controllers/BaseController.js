class BaseController {
  constructor(service) {
    this.service = service;
  }

  async getAll(req, res) {
    try {
      const results = await this.service.getAll(req.query);
      res.json({
        success: true,
        data: results,
        message: "Opération réussie",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getById(req, res) {
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
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // ✅ Méthode create dans BaseController
  async create(req, res) {
    try {
      const result = await this.service.create(req.body);
      res.status(201).json({
        success: true,
        data: result,
        message: "Créé avec succès",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // ✅ Méthode update dans BaseController
  async update(req, res) {
    try {
      const result = await this.service.update(req.params.id, req.body);
      res.json({
        success: true,
        data: result,
        message: "Mis à jour avec succès",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // ✅ Méthode delete dans BaseController
  async delete(req, res) {
    try {
      await this.service.delete(req.params.id);
      res.json({
        success: true,
        message: "Supprimé avec succès",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = BaseController;
