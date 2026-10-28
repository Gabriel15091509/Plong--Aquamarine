const BaseService = require('./BaseService');
const ReparationRepository = require('../repositories/ReparationRepository');
const { Materiel } = require('../models');

class ReparationService extends BaseService {
  constructor() {
    const repository = new ReparationRepository();
    super(repository);
    this.reparationRepository = repository;
  }

  async getByMateriel(num_inventaire) {
    return await this.reparationRepository.findByMateriel(num_inventaire);
  }

  async getEnCours() {
    return await this.reparationRepository.findEnCours();
  }

  // Même service que Materiel (pas de HTTP nécessaire, contrairement à
  // AttributionService côté activites-service) : l'entrée en atelier
  // déplace la pièce hors du local — best-effort, un matériel introuvable
  // ne doit pas bloquer la création de la fiche réparation.
  async create(data) {
    const reparation = await this.reparationRepository.create(data);

    try {
      // `etat` suit `localisation` : un matériel qui part à l'atelier ne
      // peut plus être "Bon"/"Neuf" pendant que sa réparation est en cours
      // (voir MaterielService.assertPasDeReparationActive, qui empêche
      // ensuite de le repasser "Bon" tant que cette réparation n'est pas
      // terminée). Écriture directe via le modèle (pas MaterielService) :
      // même motif que localisation juste en dessous, pour ne pas
      // redéclencher ce garde-fou sur sa propre mise à jour.
      await Materiel.update(
        { localisation: 'En réparation', etat: 'À réparer' },
        { where: { num_inventaire: data.num_inventaire } },
      );
    } catch (error) {
      console.error(`Erreur mise à jour état/localisation matériel ${data.num_inventaire}:`, error.message);
    }

    return reparation;
  }

  async terminer(id, date_retour) {
    const reparation = await this.reparationRepository.update(id, {
      statut: 'Terminée',
      date_retour,
    });

    try {
      // Symétrique de create() : la réparation terminée, le matériel
      // revient au local ET son état général est restauré à "Bon" (repli
      // raisonnable par défaut — rien dans la fiche réparation ne permet
      // de savoir si le résultat est "Neuf"/"Usagé" ; un gestionnaire peut
      // toujours l'ajuster ensuite depuis la fiche matériel).
      await Materiel.update(
        { localisation: 'Local', etat: 'Bon' },
        { where: { num_inventaire: reparation.num_inventaire } },
      );
    } catch (error) {
      console.error(`Erreur mise à jour état/localisation matériel ${reparation.num_inventaire}:`, error.message);
    }

    return reparation;
  }

  async validateReparationData(data) {
    const errors = [];

    if (!data.num_inventaire) errors.push("Le matériel est requis");
    if (!data.date_constat) errors.push("La date de constat est requise");
    if (!data.description_panne) errors.push("La description de la panne est requise");
    if (!data.prestataire) errors.push("Le prestataire est requis");
    if (data.cout === undefined || data.cout === null || data.cout < 0) {
      errors.push("Le coût est requis et doit être positif");
    }

    return errors;
  }
}

module.exports = ReparationService;
