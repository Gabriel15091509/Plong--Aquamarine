const BaseService = require("./BaseService");
const SeanceRepository = require("../repositories/SeanceRepository");
const FormationRepository = require("../repositories/FormationRepository");
const activitesClient = require("../utils/serviceClients/activitesClient");
const FormationService = require("./FormationService");

const TYPES_SEANCE = ["Théorique", "Pratique"];
const STATUTS_AUTORISES = ["Réalisée", "Absence"];

// Durée forfaitaire par type de séance (pas de saisie manuelle demandée) —
// sert au calcul des heures d'encadrement réalisées par un moniteur.
const DUREE_SEANCE_HEURES = { Théorique: 2, Pratique: 3 };

class SeanceService extends BaseService {
  constructor() {
    const repository = new SeanceRepository();
    super(repository);
    this.seanceRepository = repository;
    this.formationRepository = new FormationRepository();
    this.formationService = new FormationService();
  }

  async getByFormation(id_formation) {
    return await this.seanceRepository.findByFormation(id_formation);
  }

  async getPlanifieesByAdherent(num_adherent) {
    return await this.seanceRepository.findPlanifieesByAdherent(num_adherent);
  }

  async validateSeanceData(data, authHeader = null) {
    const errors = [];
    if (!data.id_formation) errors.push("La formation est requise");
    if (!data.date_seance) errors.push("La date de la séance est requise");
    if (!data.type_seance) errors.push("Le type de séance est requis");
    if (data.type_seance && !TYPES_SEANCE.includes(data.type_seance)) {
      errors.push(`Type de séance invalide (attendu : ${TYPES_SEANCE.join(" ou ")})`);
    }

    // Une séance pratique se déroule en réalité lors d'une sortie : elle
    // doit être liée à une sortie existante, de type "Formation" (cf.
    // taxonomie des types d'activités).
    if (data.type_seance === "Pratique") {
      if (!data.id_sortie) {
        errors.push('Une séance pratique doit être liée à une sortie de type "Formation"');
      } else {
        const sortie = await activitesClient.getSortieById(data.id_sortie, authHeader);
        if (!sortie) {
          errors.push("La sortie liée est introuvable");
        } else if (sortie.type !== "Formation") {
          errors.push('La sortie liée doit être de type "Formation"');
        }
      }
    }

    return errors;
  }

  // Marque la séance présente/absente (feuille de présence). Le passage à
  // "Réalisée" incrémente le compteur de la formation liée — remplace
  // l'ancien clic manuel "increment-sessions" par un vrai événement de
  // présence constatée.
  async updateStatut(id, { statut, commentaire }, authHeader = null, user = null) {
    if (!STATUTS_AUTORISES.includes(statut)) {
      throw new Error(`Statut invalide (attendu : ${STATUTS_AUTORISES.join(" ou ")})`);
    }

    const seance = await this.seanceRepository.findById(id);
    if (!seance) throw new Error("Séance non trouvée");

    const formation = await this.formationRepository.findById(seance.id_formation);
    if (formation) await this.formationService.assertCanModifyFormation(formation, user);

    const devientRealisee = statut === "Réalisée" && seance.statut !== "Réalisée";

    seance.statut = statut;
    if (commentaire !== undefined) seance.commentaire = commentaire;
    await seance.save();

    if (devientRealisee && formation) {
      formation.nb_seances_realisees += 1;
      await formation.save();

      // Best-effort : si c'était la dernière séance prévue et que toutes
      // les compétences sont déjà acquises, la formation se termine toute
      // seule — une panne ici ne doit pas invalider le pointage de séance.
      try {
        await this.formationService.tryAutoComplete(formation.id_formation, authHeader);
      } catch (error) {
        console.error("Erreur auto-complétion formation après séance:", error.message);
      }
    }

    return seance;
  }

  // Le moniteur assigné à la formation (résolu via la séance liée) est seul
  // habilité à modifier/supprimer une de ses séances — même règle que pour
  // la formation elle-même (FormationService.assertCanModifyFormation).
  async update(id, data, user = null) {
    const seance = await this.seanceRepository.findById(id);
    if (!seance) throw new Error("Séance non trouvée");
    const formation = await this.formationRepository.findById(seance.id_formation);
    if (formation) await this.formationService.assertCanModifyFormation(formation, user);
    return await this.seanceRepository.update(id, data);
  }

  async delete(id, user = null) {
    const seance = await this.seanceRepository.findById(id);
    if (!seance) throw new Error("Séance non trouvée");
    const formation = await this.formationRepository.findById(seance.id_formation);
    if (formation) await this.formationService.assertCanModifyFormation(formation, user);
    return await this.seanceRepository.delete(id);
  }

  // Sert à la fois de calcul d'heures d'encadrement et de "planning
  // d'encadrement" (liste des formations du moniteur) — CDC 3.5.3.
  async getEncadrementByMoniteur(id_moniteur) {
    const formations = await this.formationRepository.findByMoniteur(id_moniteur);

    let nbSeancesRealisees = 0;
    let totalHeures = 0;
    for (const formation of formations) {
      const seances = await this.seanceRepository.findByFormation(formation.id_formation);
      for (const seance of seances) {
        if (seance.statut === "Réalisée") {
          nbSeancesRealisees += 1;
          totalHeures += DUREE_SEANCE_HEURES[seance.type_seance] || 0;
        }
      }
    }

    return {
      nb_seances_realisees: nbSeancesRealisees,
      total_heures: totalHeures,
      formations,
    };
  }
}

module.exports = SeanceService;
