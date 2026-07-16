const BaseService = require("./BaseService");
const SeanceRepository = require("../repositories/SeanceRepository");
const FormationRepository = require("../repositories/FormationRepository");

const TYPES_SEANCE = ["Théorique", "Pratique"];
const STATUTS_AUTORISES = ["Réalisée", "Absence"];

class SeanceService extends BaseService {
  constructor() {
    const repository = new SeanceRepository();
    super(repository);
    this.seanceRepository = repository;
    this.formationRepository = new FormationRepository();
  }

  async getByFormation(id_formation) {
    return await this.seanceRepository.findByFormation(id_formation);
  }

  async validateSeanceData(data) {
    const errors = [];
    if (!data.id_formation) errors.push("La formation est requise");
    if (!data.date_seance) errors.push("La date de la séance est requise");
    if (!data.type_seance) errors.push("Le type de séance est requis");
    if (data.type_seance && !TYPES_SEANCE.includes(data.type_seance)) {
      errors.push(`Type de séance invalide (attendu : ${TYPES_SEANCE.join(" ou ")})`);
    }
    return errors;
  }

  // Marque la séance présente/absente (feuille de présence). Le passage à
  // "Réalisée" incrémente le compteur de la formation liée — remplace
  // l'ancien clic manuel "increment-sessions" par un vrai événement de
  // présence constatée.
  async updateStatut(id, { statut, commentaire }) {
    if (!STATUTS_AUTORISES.includes(statut)) {
      throw new Error(`Statut invalide (attendu : ${STATUTS_AUTORISES.join(" ou ")})`);
    }

    const seance = await this.seanceRepository.findById(id);
    if (!seance) throw new Error("Séance non trouvée");

    const devientRealisee = statut === "Réalisée" && seance.statut !== "Réalisée";

    seance.statut = statut;
    if (commentaire !== undefined) seance.commentaire = commentaire;
    await seance.save();

    if (devientRealisee) {
      const formation = await this.formationRepository.findById(seance.id_formation);
      if (formation) {
        formation.nb_seances_realisees += 1;
        await formation.save();
      }
    }

    return seance;
  }
}

module.exports = SeanceService;
