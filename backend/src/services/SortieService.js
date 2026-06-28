const BaseService = require('./BaseService');
const SortieRepository = require('../repositories/SortieRepository');

class SortieService extends BaseService {
  constructor() {
    const repository = new SortieRepository();
    super(repository);
    this.sortieRepository = repository;
  }

  async getUpcomingSorties() {
    return await this.sortieRepository.findUpcomingSorties();
  }

  async getSortiesWithInscriptions() {
    return await this.sortieRepository.findSortiesWithInscriptions();
  }

  // ✅ Ajout de getSortieStats
  async getSortieStats() {
    return await this.sortieRepository.getStats();
  }

  async getAvailablePlaces() {
    return await this.sortieRepository.findAvailablePlaces();
  }

  async validateSortieData(data) {
    const errors = [];
    
    if (!data.date_heure) errors.push('La date et l\'heure sont requises');
    if (!data.lieu) errors.push('Le lieu est requis');
    if (!data.site) errors.push('Le site est requis');
    if (!data.type) errors.push('Le type de sortie est requis');
    if (!data.niveau_requis) errors.push('Le niveau requis est requis');
    if (!data.nb_places || data.nb_places < 1) {
      errors.push('Le nombre de places doit être supérieur à 0');
    }
    if (!data.profondeur_max) errors.push('La profondeur maximale est requise');
    if (!data.tarif || data.tarif < 0) {
      errors.push('Le tarif doit être supérieur ou égal à 0');
    }
    if (!data.date_ouverture_inscriptions) {
      errors.push('La date d\'ouverture des inscriptions est requise');
    }
    
    if (data.date_heure && data.date_ouverture_inscriptions) {
      const dateHeure = new Date(data.date_heure);
      const dateOuverture = new Date(data.date_ouverture_inscriptions);
      if (dateOuverture > dateHeure) {
        errors.push('La date d\'ouverture des inscriptions doit être avant la date de la sortie');
      }
    }
    
    return errors;
  }

  async getSortieDetails(id) {
    const sortie = await this.getById(id, {
      include: ['inscriptions']
    });
    
    if (!sortie) return null;
    
    const confirmedCount = sortie.inscriptions ? sortie.inscriptions.filter(i => i.statut === 'Confirmée').length : 0;
    
    return {
      ...sortie.toJSON(),
      places_disponibles: sortie.nb_places - confirmedCount,
      places_occupees: confirmedCount
    };
  }
}

module.exports = SortieService;