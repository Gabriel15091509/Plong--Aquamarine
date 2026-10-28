const BaseService = require('./BaseService');
const IncidentRepository = require('../repositories/IncidentRepository');
const SortieRepository = require('../repositories/SortieRepository');
const identiteClient = require('../utils/serviceClients/identiteClient');
const { NotFoundError, ForbiddenError } = require('../utils/errors');

class IncidentService extends BaseService {
  constructor() {
    const repository = new IncidentRepository();
    super(repository);
    this.incidentRepository = repository;
    this.sortieRepository = new SortieRepository();
  }

  // Seul le président ou un moniteur désigné encadrant de LA SORTIE
  // concernée (Sortie.encadrants) peut déclarer/modifier/clôturer un
  // incident qui s'y rapporte — même garde-fou que SortieService.
  // assertCanManageSortie (voir son en-tête), dupliqué ici plutôt
  // qu'importé pour ne pas faire dépendre IncidentService de SortieService
  // (SortieService instancie déjà PalanqueeService à la volée ailleurs,
  // mieux vaut ne pas empiler une dépendance croisée de plus).
  async assertCanDeclareIncident(id_sortie, user) {
    if (!user || user.role === 'president') return;
    if (user.role !== 'moniteur') {
      throw new ForbiddenError(
        "Seuls le président et les moniteurs désignés encadrants peuvent gérer un incident sur cette sortie",
      );
    }
    const sortie = await this.sortieRepository.findById(id_sortie);
    if (!sortie) throw new NotFoundError('Sortie non trouvée');
    const moniteur = await identiteClient.getMoniteurByUserId(user.id);
    const estEncadrantDesigne =
      moniteur &&
      Array.isArray(sortie.encadrants) &&
      sortie.encadrants.includes(moniteur.id_moniteur);
    if (!estEncadrantDesigne) {
      throw new ForbiddenError(
        "Seul le président ou un encadrant désigné sur cette sortie peut gérer un incident qui s'y rapporte",
      );
    }
  }

  async create(data, user = null) {
    await this.assertCanDeclareIncident(data.id_sortie, user);
    return await this.incidentRepository.create(data);
  }

  async update(id, data, user = null) {
    const incident = await this.incidentRepository.findById(id);
    if (!incident) throw new NotFoundError('Incident non trouvé');
    await this.assertCanDeclareIncident(incident.id_sortie, user);
    return await this.incidentRepository.update(id, data);
  }

  async getBySortie(id_sortie) {
    return await this.incidentRepository.findBySortie(id_sortie);
  }

  async getNonClotures() {
    return await this.incidentRepository.findNonClotures();
  }

  async cloturer(id, mesures_prises, user = null) {
    const incident = await this.incidentRepository.findById(id);
    if (!incident) throw new NotFoundError('Incident non trouvé');
    await this.assertCanDeclareIncident(incident.id_sortie, user);
    const data = {
      cloture: true,
      date_cloture: new Date()
    };
    if (mesures_prises) data.mesures_prises = mesures_prises;

    return await this.incidentRepository.update(id, data);
  }

  async validateIncidentData(data) {
    const errors = [];

    if (!data.id_sortie) errors.push('La sortie est requise');
    if (!data.type) errors.push('Le type d\'incident est requis');
    if (!data.description) errors.push('La description est requise');

    return errors;
  }
}

module.exports = IncidentService;
