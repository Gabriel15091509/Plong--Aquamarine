const BaseService = require("./BaseService");
const FormationRepository = require("../repositories/FormationRepository");
const PaiementService = require("./PaiementService");
const { Adherent, sequelize } = require("../models");
const { NIVEAU_ORDER, getTresorierIdForUser, computeStatutPaiement } = require("../utils/roleScope");
const { sendFormationPaymentEmail } = require("../utils/email");

// Prérequis indicatifs par niveau visé (niveau antérieur minimum, nombre de
// plongées minimum, âge minimum) — valeurs raisonnables par défaut, ajustables.
const PREREQUIS_FORMATION = {
  N1: { niveauMin: null, nbPlongeesMin: 0, ageMin: 14 },
  N2: { niveauMin: "Niveau 1", nbPlongeesMin: 25, ageMin: 15 },
  N3: { niveauMin: "Niveau 2", nbPlongeesMin: 60, ageMin: 18 },
  N4: { niveauMin: "Niveau 3", nbPlongeesMin: 120, ageMin: 18 },
  MF1: { niveauMin: "Niveau 4", nbPlongeesMin: 150, ageMin: 18 },
};

function getAge(dateNaissance) {
  if (!dateNaissance) return 0;
  const diff = Date.now() - new Date(dateNaissance).getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

class FormationService extends BaseService {
  constructor() {
    const repository = new FormationRepository();
    super(repository);
    this.formationRepository = repository;
    this.paiementService = new PaiementService();
  }

  async getAll() {
    return await this.formationRepository.findAll();
  }

  async getById(id) {
    return await this.formationRepository.findById(id);
  }

  // ✅ findByAdherent au lieu de findFormationsByAdherent
  async getFormationsByAdherent(num_adherent) {
    return await this.formationRepository.findByAdherent(num_adherent);
  }

  // ✅ findActive au lieu de findActiveFormations
  async getActiveFormations() {
    return await this.formationRepository.findActive();
  }

  // ✅ getStats retourne maintenant { total, enCours, terminees, abandonnees }
  async getFormationStats() {
    return await this.formationRepository.getStats();
  }

  // ✅ findWithCompetences au lieu de findFormationWithCompetences
  async getFormationWithCompetences(id) {
    return await this.formationRepository.findWithCompetences(id);
  }

  async validateFormationData(data) {
    const errors = [];
    if (!data.num_adherent) errors.push("L'adhérent est requis");
    if (!data.id_moniteur) errors.push("Le moniteur est requis");
    if (!data.niveau_vise)  errors.push("Le niveau visé est requis");
    if (!data.date_debut)   errors.push("La date de début est requise");
    if (!data.date_fin_prevue) errors.push("La date de fin prévue est requise");
    if (data.date_debut && data.date_fin_prevue) {
      if (new Date(data.date_fin_prevue) <= new Date(data.date_debut)) {
        errors.push("La date de fin doit être postérieure à la date de début");
      }
    }

    if (data.num_adherent && data.niveau_vise) {
      const prerequisErrors = await this.checkPrerequis(data.num_adherent, data.niveau_vise);
      errors.push(...prerequisErrors);
    }

    // Une formation payante ne peut pas démarrer "En cours" sans qu'un
    // premier paiement (même un acompte) ait été enregistré — même règle
    // que pour le pointage "présent" d'une sortie.
    const montantTotal = Number(data.montant_total) || 0;
    const montantPaye = Number(data.montant_paye) || 0;
    const statut = data.statut || "En cours";
    if (statut === "En cours" && montantTotal > 0 && montantPaye <= 0) {
      errors.push(
        "Le paiement doit être initié (au moins un acompte) avant de démarrer une formation payante.",
      );
    }

    return errors;
  }

  // Vérifie le niveau antérieur, le nombre de plongées et l'âge minimum
  // requis pour s'inscrire à la formation visée.
  async checkPrerequis(num_adherent, niveau_vise) {
    const prerequis = PREREQUIS_FORMATION[niveau_vise];
    if (!prerequis) return [];

    const adherent = await Adherent.findByPk(num_adherent);
    if (!adherent) return ["Adhérent introuvable"];

    const errors = [];
    if (prerequis.niveauMin) {
      const possede = NIVEAU_ORDER.indexOf(adherent.niveau);
      const requis = NIVEAU_ORDER.indexOf(prerequis.niveauMin);
      if (possede < requis) {
        errors.push(`Niveau insuffisant (niveau minimum requis : ${prerequis.niveauMin})`);
      }
    }
    if ((adherent.nb_plongees_total || 0) < prerequis.nbPlongeesMin) {
      errors.push(`Nombre de plongées insuffisant (minimum requis : ${prerequis.nbPlongeesMin})`);
    }
    if (getAge(adherent.date_naissance) < prerequis.ageMin) {
      errors.push(`Âge minimum requis : ${prerequis.ageMin} ans`);
    }
    return errors;
  }

  // La formation n'a pas systématiquement de coût (montant_total est
  // facultatif, à la différence de l'adhésion Club) : si un montant est
  // renseigné, on suit son paiement (montant_paye/statut_paiement) comme
  // pour une adhésion ; sinon la formation reste simplement sans tarif suivi.
  async create(data, user = null) {
    const montantTotal =
      data.montant_total !== undefined && data.montant_total !== null && data.montant_total !== ""
        ? Number(data.montant_total)
        : null;

    if (!montantTotal || montantTotal <= 0) {
      return await this.formationRepository.create({
        ...data,
        montant_total: null,
        montant_paye: 0,
        statut_paiement: "Payé",
      });
    }

    const montantPaye =
      data.montant_paye !== undefined && data.montant_paye !== null && data.montant_paye !== ""
        ? Number(data.montant_paye)
        : 0;
    const statut_paiement = computeStatutPaiement(montantTotal, montantPaye);

    const formation = await this.formationRepository.create({
      ...data,
      montant_total: montantTotal,
      montant_paye: montantPaye,
      statut_paiement,
    });

    if (montantPaye > 0) {
      const id_tresorier = await getTresorierIdForUser(user);
      await this.paiementService.createLinkedPayment({
        num_adherent: data.num_adherent,
        montant: montantPaye,
        mode: data.mode || "Espèces",
        type_paiement: "Formation",
        reference_id: formation.id_formation,
        id_tresorier,
        description: `Formation ${data.niveau_vise}`,
      });
      await this.notifyPayment(formation);
    }

    return formation;
  }

  async notifyPayment(formation) {
    try {
      const adherent = await Adherent.findByPk(formation.num_adherent);
      if (!adherent?.email) return;
      await sendFormationPaymentEmail({
        to: adherent.email,
        adherentName: `${adherent.prenom} ${adherent.nom}`,
        niveauVise: formation.niveau_vise,
        montantPaye: formation.montant_paye,
        montantTotal: formation.montant_total,
        statutPaiement: formation.statut_paiement,
      });
    } catch (error) {
      console.error("Erreur envoi email confirmation paiement formation:", error.message);
    }
  }

  // Ajoute un versement complémentaire (acompte/solde) — même logique que
  // AdhesionService.enregistrerPaiementComplementaire.
  async enregistrerPaiement(id_formation, { montant, mode, description }, user = null) {
    if (!montant || montant <= 0) throw new Error("Le montant doit être supérieur à 0");

    // Verrou de ligne (même raisonnement que InscriptionService.enregistrerPaiement) :
    // sans lui, deux requêtes quasi simultanées liraient le même solde de
    // départ et produiraient chacune leur propre ligne Paiement, avec un
    // solde final incohérent.
    const { updated, isDuplicate } = await sequelize.transaction(async (t) => {
      const formation = await this.formationRepository.findById(id_formation, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!formation) throw new Error("Formation non trouvée");
      if (!formation.montant_total) {
        throw new Error("Cette formation n'a pas de tarif à régler");
      }

      const isDuplicate = await this.paiementService.hasRecentDuplicate({
        num_adherent: formation.num_adherent,
        type_paiement: "Formation",
        reference_id: id_formation,
        montant,
      });
      if (isDuplicate) return { updated: formation, isDuplicate: true };

      const nouveauMontantPaye = Number(formation.montant_paye || 0) + Number(montant);
      const statut_paiement = computeStatutPaiement(formation.montant_total, nouveauMontantPaye);

      const updated = await this.formationRepository.update(
        id_formation,
        { montant_paye: nouveauMontantPaye, statut_paiement },
        { transaction: t },
      );

      const id_tresorier = await getTresorierIdForUser(user);
      await this.paiementService.createLinkedPayment({
        num_adherent: formation.num_adherent,
        montant,
        mode: mode || "Espèces",
        type_paiement: "Formation",
        reference_id: id_formation,
        id_tresorier,
        description: description || `Complément formation ${formation.niveau_vise}`,
      });

      return { updated, isDuplicate: false };
    });

    if (isDuplicate) return updated;

    await this.notifyPayment(updated);

    return updated;
  }

  // Même règle qu'à la création : impossible de (re)passer une formation
  // payante à "En cours" (ex. après une édition) tant qu'aucun paiement n'a
  // été enregistré — vérifié contre le montant_paye réel de la formation,
  // que l'édition ne modifie jamais elle-même (géré via enregistrerPaiement).
  async update(id, data) {
    const formation = await this.formationRepository.findById(id);
    if (!formation) throw new Error("Formation non trouvée");

    const nextStatut = data.statut !== undefined ? data.statut : formation.statut;
    const nextMontantTotal =
      data.montant_total !== undefined && data.montant_total !== null && data.montant_total !== ""
        ? Number(data.montant_total)
        : Number(formation.montant_total) || 0;
    const montantPaye = Number(formation.montant_paye) || 0;

    if (nextStatut === "En cours" && nextMontantTotal > 0 && montantPaye <= 0) {
      throw new Error(
        "Le paiement doit être initié (au moins un acompte) avant de démarrer une formation payante.",
      );
    }

    return await this.formationRepository.update(id, data);
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