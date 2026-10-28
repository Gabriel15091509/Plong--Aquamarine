const BaseController = require("./BaseController");
const BrevetService = require("../services/BrevetService");
const { withStatus } = require("../utils/errors");

class BrevetController extends BaseController {
  constructor() {
    const service = new BrevetService();
    super(service);
    this.brevetService = service;
  }

  async getAll(req, res, next) {
    try {
      const results = await this.brevetService.getAll(req.user);
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
      const results = await this.brevetService.getByAdherent(num_adherent, req.user);
      res.json({
        success: true,
        data: results,
        count: results.length,
      });
    } catch (error) {
      next(withStatus(error, 403));
    }
  }
}

module.exports = BrevetController;
