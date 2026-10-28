const BaseService = require('./BaseService');
const CompetenceRepository = require('../repositories/CompetenceRepository');
const FormationService = require('./FormationService');
const { NotFoundError } = require('../utils/errors');

class CompetenceService extends BaseService {
  constructor() {
    const repository = new CompetenceRepository();
    super(repository);
    this.competenceRepository = repository;
    this.formationService = new FormationService();
  }

  async getByFormation(id_formation) {
    return await this.competenceRepository.findByFormation(id_formation);
  }

  // Le niveau requis d'une compétence n'est jamais saisi à la main : c'est
  // toujours celui visé par SA formation (Formation.niveau_vise) — une
  // compétence n'existe que dans le cadre d'une formation précise, pas
  // question qu'elle demande un niveau différent de celui que cette
  // formation prépare. `data.niveau_requis` fourni par l'appelant (ancien
  // formulaire, script...) est donc ignoré, jamais fusionné : sinon une
  // valeur incohérente resterait possible en la fournissant quand même.
  // Le champ reste stocké sur Competence (recopie, pas une jointure à
  // chaque affichage), mais n'a plus qu'une seule source de vérité — voir
  // aussi la migration de rattrapage pour les lignes déjà existantes
  // (app.js:runPendingMigrations).
  async create(data) {
    const formation = await this.formationService.formationRepository.findById(
      data.id_formation,
    );
    if (!formation) throw new NotFoundError('Formation non trouvée');
    return await this.competenceRepository.create({
      ...data,
      niveau_requis: formation.niveau_vise,
    });
  }

  async valider(id, validee_par, authHeader = null, user = null) {
    const existante = await this.competenceRepository.findById(id);
    if (!existante) throw new Error("Compétence non trouvée");
    const formation = await this.formationService.formationRepository.findById(existante.id_formation);
    if (formation) await this.formationService.assertCanModifyFormation(formation, user);

    const competence = await this.competenceRepository.update(id, {
      acquise: true,
      date_validation: new Date(),
      validee_par
    });

    // Best-effort : si c'était la dernière condition manquante (séances +
    // compétences), la formation vient de se terminer toute seule — une
    // panne ici ne doit pas invalider la validation de compétence elle-même.
    try {
      await this.formationService.tryAutoComplete(competence.id_formation, authHeader);
    } catch (error) {
      console.error("Erreur auto-complétion formation après validation compétence:", error.message);
    }

    return competence;
  }

  // Le moniteur assigné à la formation (résolue via la compétence liée) est
  // seul habilité à modifier/supprimer une de ses compétences — même règle
  // que pour la formation elle-même (FormationService.assertCanModifyFormation).
  async update(id, data, user = null) {
    const existante = await this.competenceRepository.findById(id);
    if (!existante) throw new Error("Compétence non trouvée");
    const formation = await this.formationService.formationRepository.findById(existante.id_formation);
    if (formation) await this.formationService.assertCanModifyFormation(formation, user);
    return await this.competenceRepository.update(id, data);
  }

  async delete(id, user = null) {
    const existante = await this.competenceRepository.findById(id);
    if (!existante) throw new Error("Compétence non trouvée");
    const formation = await this.formationService.formationRepository.findById(existante.id_formation);
    if (formation) await this.formationService.assertCanModifyFormation(formation, user);
    return await this.competenceRepository.delete(id);
  }

  async validateCompetenceData(data, user = null) {
    const errors = [];

    if (!data.id_formation) errors.push("La formation est requise");
    if (!data.libelle) errors.push("Le libellé est requis");
    // Plus de "niveau requis" à valider ici : create() ci-dessous l'impose
    // toujours depuis Formation.niveau_vise, jamais depuis une saisie.

    // Seul le moniteur assigné à cette formation peut y ajouter une
    // compétence — même règle que pour modifier/supprimer/valider une
    // compétence déjà existante (voir CompetenceService.update/delete/
    // valider) ou la formation elle-même
    // (FormationService.assertCanModifyFormation). Lève une ForbiddenError
    // (pas un ajout à `errors`) pour rester cohérent avec
    // assertCanModifyFormation partout ailleurs : une interdiction d'accès
    // reste un 403, jamais un 400 de validation.
    if (data.id_formation) {
      const formation = await this.formationService.formationRepository.findById(data.id_formation);
      if (formation) await this.formationService.assertCanModifyFormation(formation, user);
    }

    return errors;
  }
}

module.exports = CompetenceService;
