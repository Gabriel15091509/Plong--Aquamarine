const BaseController = require('./BaseController');
const PalanqueeService = require('../services/PalanqueeService');

class PalanqueeController extends BaseController {
  constructor() {
    const service = new PalanqueeService();
    super(service);
    this.palanqueeService = service;
  }

  async getAll(req, res) {
    try {
      const results = await this.palanqueeService.getAll(req.user);
      res.json({ success: true, data: results, count: results.length });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const result = await this.palanqueeService.getById(parseInt(id), req.user);
      if (!result) {
        return res.status(404).json({ success: false, message: 'Palanquée non trouvée' });
      }
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(403).json({ success: false, message: error.message });
    }
  }

  async create(req, res) {
    try {
      const result = await this.palanqueeService.create(req.body, req.user);
      res.status(201).json({ success: true, data: result, message: 'Palanquée créée avec succès' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getByPlongee(req, res) {
    try {
      const { id_plongee } = req.params;
      const results = await this.palanqueeService.getByPlongee(parseInt(id_plongee), req.user);
      res.json({ success: true, data: results, count: results.length });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getBySortie(req, res) {
    try {
      const { id_sortie } = req.params;
      const results = await this.palanqueeService.getBySortie(parseInt(id_sortie), req.user);
      res.json({ success: true, data: results, count: results.length });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getByMoniteur(req, res) {
    try {
      const { id_moniteur } = req.params;
      const results = await this.palanqueeService.getByMoniteur(parseInt(id_moniteur));
      res.json({ success: true, data: results, count: results.length });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getStatsBySortie(req, res) {
    try {
      const { id_sortie } = req.params;
      const stats = await this.palanqueeService.getStatsBySortie(parseInt(id_sortie));
      res.json({ success: true, data: stats });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async addMembre(req, res) {
    try {
      const { id } = req.params;
      const { num_adherent } = req.body;

      if (!num_adherent) {
        return res.status(400).json({ success: false, message: "L'adhérent est requis" });
      }

      const result = await this.palanqueeService.addMembre(parseInt(id), num_adherent, req.user);
      res.status(201).json({ success: true, data: result, message: 'Membre ajouté avec succès' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async removeMembre(req, res) {
    try {
      const { id, num_adherent } = req.params;
      await this.palanqueeService.removeMembre(parseInt(id), num_adherent, req.user);
      res.json({ success: true, message: 'Membre retiré avec succès' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async updateEncadrement(req, res) {
    try {
      const { id } = req.params;
      const { id_guide_palanquee, id_secouriste } = req.body;
      const result = await this.palanqueeService.updateEncadrement(
        parseInt(id),
        { id_guide_palanquee, id_secouriste },
        req.user,
      );
      res.json({ success: true, data: result, message: 'Encadrement mis à jour' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async enregistrerDonneesPlongee(req, res) {
    try {
      const { id } = req.params;
      const result = await this.palanqueeService.enregistrerDonneesPlongee(
        parseInt(id),
        req.body,
        req.user,
      );
      res.json({ success: true, data: result, message: 'Données de plongée enregistrées' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async retournerMateriel(req, res) {
    try {
      const { id } = req.params;
      const { retours } = req.body;
      const result = await this.palanqueeService.retournerMateriel(
        parseInt(id),
        retours || [],
        req.user,
      );
      res.json({ success: true, data: result, message: 'Retour de matériel enregistré' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async cloturer(req, res) {
    try {
      const { id } = req.params;
      const result = await this.palanqueeService.cloturer(parseInt(id), req.user);
      res.json({ success: true, data: result, message: 'Palanquée clôturée' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
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
