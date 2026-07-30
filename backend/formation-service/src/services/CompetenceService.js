const BaseService = require('./BaseService');
const CompetenceRepository = require('../repositories/CompetenceRepository');
const FormationService = require('./FormationService');

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

  async validateCompetenceData(data) {
    const errors = [];

    if (!data.id_formation) errors.push("La formation est requise");
    if (!data.libelle) errors.push("Le libellé est requis");
    if (!data.niveau_requis) errors.push("Le niveau requis est requis");

    return errors;
  }
}

module.exports = CompetenceService;
