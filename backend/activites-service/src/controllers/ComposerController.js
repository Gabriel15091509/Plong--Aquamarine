const BaseController = require('./BaseController');
const ComposerService = require('../services/ComposerService');
const { withStatus } = require('../utils/errors');

class ComposerController extends BaseController {
  constructor() {
    const service = new ComposerService();
    super(service);
    this.composerService = service;
  }

  async getByAdherent(req, res, next) {
    try {
      const { num_adherent } = req.params;
      const results = await this.composerService.getByAdherent(num_adherent);
      res.json({
        success: true,
        data: results,
        count: results.length
      });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async validateBeforeCreate(req, res, next) {
    const errors = await this.composerService.validateComposerData(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors
      });
    }
    next();
  }
}

module.exports = ComposerController;
