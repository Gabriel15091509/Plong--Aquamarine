const BaseService = require("./BaseService");
const FormationRepository = require("../repositories/FormationRepository");

class FormationService extends BaseService {
  constructor() {
    const repository = new FormationRepository();
    super(repository);
    this.formationRepository = repository;
  }

  async getFormationsByAdherent(num_adherent) {
    return await this.formationRepository.findFormationsByAdherent(
      num_adherent,
    );
  }

  async getActiveFormations() {
    return await this.formationRepository.findActiveFormations();
  }

  // ✅ Ajout de getFormationStats
  async getFormationStats() {
    return await this.formationRepository.getStats();
  }

  async getFormationWithCompetences(id) {
    return await this.formationRepository.findFormationWithCompetences(id);
  }

  async validateFormationData(data) {
    const errors = [];

    if (!data.num_adherent) errors.push("L'adhérent est requis");
    if (!data.niveau_vise) errors.push("Le niveau visé est requis");
    if (!data.date_debut) errors.push("La date de début est requise");
    if (!data.date_fin_prevue) errors.push("La date de fin prévue est requise");

    if (data.date_debut && data.date_fin_prevue) {
      const debut = new Date(data.date_debut);
      const fin = new Date(data.date_fin_prevue);
      if (fin <= debut) {
        errors.push(
          "La date de fin prévue doit être postérieure à la date de début",
        );
      }
    }

    return errors;
  }

  async incrementSessions(id) {
    const formation = await this.getById(id);
    if (!formation) throw new Error("Formation non trouvée");

    formation.nb_seances_realisees += 1;
    await formation.save();

    return formation;
  }

  async completeFormation(id) {
    const formation = await this.getById(id);
    if (!formation) throw new Error("Formation non trouvée");

    formation.statut = "Terminée";
    await formation.save();

    return formation;
  }
}

module.exports = FormationService;
