const BaseController = require('./BaseController');
const ComposerService = require('../services/ComposerService');

class ComposerController extends BaseController {
  constructor() {
    const service = new ComposerService();
    super(service);
    this.composerService = service;
  }

  async getByAdherent(req, res) {
    try {
      const { num_adherent } = req.params;
      const results = await this.composerService.getByAdherent(num_adherent);
      res.json({
        success: true,
        data: results,
        count: results.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
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
