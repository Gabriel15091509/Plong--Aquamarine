const BaseController = require('./BaseController');
const PalanqueeService = require('../services/PalanqueeService');
const { withStatus } = require('../utils/errors');

class PalanqueeController extends BaseController {
  constructor() {
    const service = new PalanqueeService();
    super(service);
    this.palanqueeService = service;
  }

  async getAll(req, res, next) {
    try {
      const results = await this.palanqueeService.getAll(req.user, req.headers.authorization);
      res.json({ success: true, data: results, count: results.length });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const result = await this.palanqueeService.getById(parseInt(id), req.user, req.headers.authorization);
      if (!result) {
        return res.status(404).json({ success: false, message: 'Palanquée non trouvée' });
      }
      res.json({ success: true, data: result });
    } catch (error) {
      next(withStatus(error, 403));
    }
  }

  async create(req, res, next) {
    try {
      const result = await this.palanqueeService.create(req.body, req.user, req.headers.authorization);
      res.status(201).json({ success: true, data: result, message: 'Palanquée créée avec succès' });
    } catch (error) {
      next(withStatus(error, 400));
    }
  }

  async getByPlongee(req, res, next) {
    try {
      const { id_plongee } = req.params;
      const results = await this.palanqueeService.getByPlongee(parseInt(id_plongee), req.user, req.headers.authorization);
      res.json({ success: true, data: results, count: results.length });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async getBySortie(req, res, next) {
    try {
      const { id_sortie } = req.params;
      const results = await this.palanqueeService.getBySortie(parseInt(id_sortie), req.user, req.headers.authorization);
      res.json({ success: true, data: results, count: results.length });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async getByMoniteur(req, res, next) {
    try {
      const { id_moniteur } = req.params;
      const results = await this.palanqueeService.getByMoniteur(parseInt(id_moniteur), req.headers.authorization);
      res.json({ success: true, data: results, count: results.length });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async getStatsBySortie(req, res, next) {
    try {
      const { id_sortie } = req.params;
      const stats = await this.palanqueeService.getStatsBySortie(parseInt(id_sortie));
      res.json({ success: true, data: stats });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async addMembre(req, res, next) {
    try {
      const { id } = req.params;
      const { num_adherent } = req.body;

      if (!num_adherent) {
        return res.status(400).json({ success: false, message: "L'adhérent est requis" });
      }

      const result = await this.palanqueeService.addMembre(parseInt(id), num_adherent, req.user, req.headers.authorization);
      res.status(201).json({ success: true, data: result, message: 'Membre ajouté avec succès' });
    } catch (error) {
      next(withStatus(error, 400));
    }
  }

  async removeMembre(req, res, next) {
    try {
      const { id, num_adherent } = req.params;
      await this.palanqueeService.removeMembre(parseInt(id), num_adherent, req.user);
      res.json({ success: true, message: 'Membre retiré avec succès' });
    } catch (error) {
      next(withStatus(error, 400));
    }
  }

  async updateEncadrement(req, res, next) {
    try {
      const { id } = req.params;
      const { id_guide_palanquee, id_secouriste, id_moniteur_encadrant } = req.body;
      const result = await this.palanqueeService.updateEncadrement(
        parseInt(id),
        { id_guide_palanquee, id_secouriste, id_moniteur_encadrant },
        req.user,
        req.headers.authorization,
      );
      res.json({ success: true, data: result, message: 'Encadrement mis à jour' });
    } catch (error) {
      next(withStatus(error, 400));
    }
  }

  async enregistrerDonneesPlongee(req, res, next) {
    try {
      const { id } = req.params;
      const result = await this.palanqueeService.enregistrerDonneesPlongee(
        parseInt(id),
        req.body,
        req.user,
      );
      res.json({ success: true, data: result, message: 'Données de plongée enregistrées' });
    } catch (error) {
      next(withStatus(error, 400));
    }
  }

  async retournerMateriel(req, res, next) {
    try {
      const { id } = req.params;
      const { retours } = req.body;
      const result = await this.palanqueeService.retournerMateriel(
        parseInt(id),
        retours || [],
        req.user,
        req.headers.authorization,
      );
      res.json({ success: true, data: result, message: 'Retour de matériel enregistré' });
    } catch (error) {
      next(withStatus(error, 400));
    }
  }

  async cloturer(req, res, next) {
    try {
      const { id } = req.params;
      const result = await this.palanqueeService.cloturer(parseInt(id), req.user);
      res.json({ success: true, data: result, message: 'Palanquée clôturée' });
    } catch (error) {
      next(withStatus(error, 400));
    }
  }

  async validateBeforeCreate(req, res, next) {
    const errors = await this.palanqueeService.validatePalanqueeData(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }
    next();
  }
}

module.exports = PalanqueeController;
