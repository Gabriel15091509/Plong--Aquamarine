const BaseService = require('./BaseService');
const MaterielRepository = require('../repositories/MaterielRepository');

class MaterielService extends BaseService {
  constructor() {
    const repository = new MaterielRepository();
    super(repository);
    this.materielRepository = repository;
  }

  async getAvailableMateriel() {
    return await this.materielRepository.findAvailableMateriel();
  }

  async getMaterielNeedingMaintenance() {
    return await this.materielRepository.findMaterielNeedingMaintenance();
  }

  async getMaterielWithReparations() {
    return await this.materielRepository.findMaterielWithReparations();
  }

  // ✅ Ajout de getMaterielStats
  async getMaterielStats() {
    return await this.materielRepository.getStats();
  }

  async validateMaterielData(data) {
    const errors = [];
    
    if (!data.num_inventaire) errors.push('Le numéro d\'inventaire est requis');
    if (!data.categorie) errors.push('La catégorie est requise');
    if (!data.marque) errors.push('La marque est requise');
    if (!data.modele) errors.push('Le modèle est requis');
    if (!data.date_achat) errors.push('La date d\'achat est requise');
    if (!data.localisation) errors.push('La localisation est requise');
    
    return errors;
  }

  async updateEtat(num_inventaire, etat) {
    const materiel = await this.getById(num_inventaire);
    if (!materiel) throw new Error('Matériel non trouvé');
    
    materiel.etat = etat;
    await materiel.save();
    
    return materiel;
  }

  async checkAvailability(num_inventaire) {
    const materiel = await this.getById(num_inventaire);
    if (!materiel) return false;
    
    return materiel.etat === 'Bon' || materiel.etat === 'Neuf';
  }
}

module.exports = MaterielService;