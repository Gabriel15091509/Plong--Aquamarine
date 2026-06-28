const BaseService = require('./BaseService');
const InscriptionRepository = require('../repositories/InscriptionRepository');
const SortieService = require('./SortieService');
const { Op } = require('sequelize');

class InscriptionService extends BaseService {
  constructor() {
    const repository = new InscriptionRepository();
    super(repository);
    this.inscriptionRepository = repository;
    this.sortieService = new SortieService();
  }

  async getConfirmationsBySortie(id_sortie) {
    return await this.inscriptionRepository.findConfirmationsBySortie(id_sortie);
  }

  async getByAdherentAndSortie(num_adherent, id_sortie) {
    return await this.inscriptionRepository.findByAdherentAndSortie(num_adherent, id_sortie);
  }

  async getWaitlistBySortie(id_sortie) {
    return await this.inscriptionRepository.getWaitlistBySortie(id_sortie);
  }

  async getInscriptionStats() {
    return await this.inscriptionRepository.getInscriptionStats();
  }

  async createInscription(data) {
    // Vérifier si l'adhérent est déjà inscrit
    const existing = await this.getByAdherentAndSortie(data.num_adherent, data.id_sortie);
    if (existing) {
      throw new Error('Cet adhérent est déjà inscrit à cette sortie');
    }

    // Vérifier les places disponibles
    const sortie = await this.sortieService.getSortieDetails(data.id_sortie);
    if (!sortie) {
      throw new Error('Sortie non trouvée');
    }

    if (sortie.statut === 'Annulée') {
      throw new Error('Cette sortie est annulée');
    }

    const confirmedCount = sortie.inscriptions ? sortie.inscriptions.filter(i => i.statut === 'Confirmée').length : 0;
    const placesDisponibles = sortie.nb_places - confirmedCount;

    // Déterminer le statut
    let statut = 'Confirmée';
    let rangListeAttente = null;

    if (placesDisponibles <= 0) {
      statut = "Liste d'attente";
      const waitlist = await this.getWaitlistBySortie(data.id_sortie);
      rangListeAttente = waitlist.length + 1;
    }

    return await this.inscriptionRepository.create({
      ...data,
      statut,
      rang_liste_attente: rangListeAttente
    });
  }

  async confirmInscription(id) {
    const inscription = await this.getById(id);
    if (!inscription) throw new Error('Inscription non trouvée');

    if (inscription.statut === "Liste d'attente") {
      // Vérifier les places disponibles
      const sortie = await this.sortieService.getSortieDetails(inscription.id_sortie);
      const confirmedCount = sortie.inscriptions.filter(i => i.statut === 'Confirmée').length;
      const placesDisponibles = sortie.nb_places - confirmedCount;

      if (placesDisponibles <= 0) {
        throw new Error('Plus de places disponibles');
      }
    }

    inscription.statut = 'Confirmée';
    inscription.date_confirmation = new Date();
    await inscription.save();
    
    return inscription;
  }

  async cancelInscription(id) {
    const inscription = await this.getById(id);
    if (!inscription) throw new Error('Inscription non trouvée');

    inscription.statut = 'Annulée';
    await inscription.save();
    
    // Réattribuer la place à la liste d'attente si nécessaire
    if (inscription.statut === "Liste d'attente") {
      const waitlist = await this.getWaitlistBySortie(inscription.id_sortie);
      for (const wait of waitlist) {
        if (wait.rang_liste_attente > inscription.rang_liste_attente) {
          wait.rang_liste_attente -= 1;
          await wait.save();
        }
      }
    }
    
    return inscription;
  }

  async validateInscriptionData(data) {
    const errors = [];
    
    if (!data.num_adherent) errors.push('L\'adhérent est requis');
    if (!data.id_sortie) errors.push('La sortie est requise');
    
    return errors;
  }
}

module.exports = InscriptionService;