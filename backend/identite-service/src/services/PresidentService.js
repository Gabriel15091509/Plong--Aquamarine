const BaseService = require('./BaseService');
const PresidentRepository = require('../repositories/PresidentRepository');
const MoniteurService = require('./MoniteurService');

class PresidentService extends BaseService {
  constructor() {
    const repository = new PresidentRepository();
    super(repository);
    this.presidentRepository = repository;
    this.moniteurService = new MoniteurService();
  }

  async create(data) {
    let id_moniteur = data.id_moniteur;
    let welcomeEmail = null;

    if (!id_moniteur) {
      const moniteur = await this.moniteurService.create(data);
      id_moniteur = moniteur.id_moniteur;
      welcomeEmail = moniteur._welcomeEmail || null;
    }

    const president = await this.presidentRepository.create({
      id_moniteur,
      annee_en_poste: data.annee_en_poste,
      acces: data.acces
    });
    const plain = president.toJSON();
    return welcomeEmail ? { ...plain, _welcomeEmail: welcomeEmail } : plain;
  }

  async getCurrent() {
    return await this.presidentRepository.findCurrent();
  }

  async getByAnnee(annee) {
    return await this.presidentRepository.findByAnnee(annee);
  }

  // Endpoint interne : utilisé par activites-service (IncidentController)
  // pour résoudre `declared_by` (id_president) à partir du moniteur connecté.
  async getByMoniteurId(id_moniteur) {
    return await this.presidentRepository.findByMoniteurId(id_moniteur);
  }

  async validatePresidentData(data) {
    const errors = [];

    if (!data.id_moniteur) {
      if (!data.num_brevet) errors.push('Le numéro de brevet du moniteur est requis');
      if (!data.date_obtention_brevet) errors.push('La date d\'obtention du brevet est requise');
      if (!data.user_id && (!data.email || !data.name)) {
        errors.push('L\'email et le nom sont requis pour créer le compte du moniteur');
      }
    }

    if (!data.annee_en_poste) errors.push('L\'année en poste est requise');

    return errors;
  }
}

module.exports = PresidentService;
