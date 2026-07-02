const BaseController = require('./BaseController');
const InscriptionService = require('../services/InscriptionService');

class InscriptionController extends BaseController {
  constructor() {
    const service = new InscriptionService();
    super(service);
    this.inscriptionService = service;
  }

  // ✅ Mise à jour d'une inscription
  async update(req, res) {
    try {
      const { id } = req.params;
      const data = req.body;
      
      console.log('📝 PUT /inscriptions/:id - ID:', id, 'Data:', data);
      
      const cleanData = this.cleanInscriptionData(data);
      const result = await this.inscriptionService.update(parseInt(id), cleanData);
      
      res.json({
        success: true,
        data: result,
        message: 'Inscription mise à jour avec succès'
      });
    } catch (error) {
      console.error('❌ Erreur update inscription:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // ✅ Nettoyer les données
  cleanInscriptionData(data) {
    const cleanData = { ...data };
    
    if (cleanData.presence_check_time) {
      const date = new Date(cleanData.presence_check_time);
      if (!isNaN(date.getTime())) {
        cleanData.presence_check_time = date;
      } else {
        cleanData.presence_check_time = null;
      }
    }
    
    if (cleanData.presence_check_by) {
      cleanData.presence_check_by = parseInt(cleanData.presence_check_by);
    }
    
    if (cleanData.presence !== undefined) {
      cleanData.presence = Boolean(cleanData.presence);
    }
    
    if (cleanData.presence_checked !== undefined) {
      cleanData.presence_checked = Boolean(cleanData.presence_checked);
    }
    
    return cleanData;
  }

  async getBySortie(req, res) {
    try {
      const { id_sortie } = req.params;
      const results = await this.inscriptionService.getConfirmationsBySortie(parseInt(id_sortie));
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

  async getByAdherentAndSortie(req, res) {
    try {
      const { num_adherent, id_sortie } = req.params;
      const result = await this.inscriptionService.getByAdherentAndSortie(
        parseInt(num_adherent),
        parseInt(id_sortie)
      );
      res.json({
        success: true,
        data: result || null
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getWaitlist(req, res) {
    try {
      const { id_sortie } = req.params;
      const results = await this.inscriptionService.getWaitlistBySortie(parseInt(id_sortie));
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

  async getStats(req, res) {
    try {
      const stats = await this.inscriptionService.getInscriptionStats();
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async createInscription(req, res) {
    try {
      const result = await this.inscriptionService.createInscription(req.body);
      res.status(201).json({
        success: true,
        data: result,
        message: 'Inscription créée avec succès'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async confirmInscription(req, res) {
    try {
      const result = await this.inscriptionService.confirmInscription(req.params.id);
      res.json({
        success: true,
        data: result,
        message: 'Inscription confirmée avec succès'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async cancelInscription(req, res) {
    try {
      const result = await this.inscriptionService.cancelInscription(req.params.id);
      res.json({
        success: true,
        data: result,
        message: 'Inscription annulée avec succès'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async validateBeforeCreate(req, res, next) {
    const errors = await this.inscriptionService.validateInscriptionData(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors
      });
    }
    next();
  }
}

module.exports = InscriptionController;