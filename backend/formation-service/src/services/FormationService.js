const BaseService = require("./BaseService");
const FormationRepository = require("../repositories/FormationRepository");
const CompetenceRepository = require("../repositories/CompetenceRepository");
const identiteClient = require("../utils/serviceClients/identiteClient");
const paiementClient = require("../utils/serviceClients/paiementClient");
const vieAssociativeClient = require("../utils/serviceClients/vieAssociativeClient");
const { NIVEAU_ORDER, computeStatutPaiement } = require("../utils/roleScope");
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

// Niveau adhérent obtenu une fois la formation visée terminée (voir
// NIVEAU_ORDER dans roleScope.js pour les valeurs acceptées côté identite-service).
const NIVEAU_OBTENU = {
  N1: "Niveau 1",
  N2: "Niveau 2",
  N3: "Niveau 3",
  N4: "Niveau 4",
  MF1: "Moniteur",
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
    this.competenceRepository = new CompetenceRepository();
  }

  async getAll() {
    return await this.formationRepository.findAll();
  }

  async getById(id) {
    return await this.formationRepository.findById(id);
  }

  async getFormationsByAdherent(num_adherent) {
    return await this.formationRepository.findByAdherent(num_adherent);
  }

  async getActiveFormations() {
    return await this.formationRepository.findActive();
  }

  async getFormationStats() {
    return await this.formationRepository.getStats();
  }

  // Même calcul que DashboardService.countTrend dans le monolithe — dupliqué
  // ici pour que formation-service reste seul propriétaire de ses données ;
  // exposé via `GET /formations/trend` pour que le dashboard (qui vit encore
  // dans le monolithe) puisse le récupérer par HTTP au lieu d'une requête
  // Sequelize directe sur un modèle qui ne lui appartient plus.
  async getTrend() {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastPeriod = new Date(startOfLastMonth);
    endOfLastPeriod.setDate(startOfLastMonth.getDate() + now.getDate());

    const [current, previous] = await Promise.all([
      this.formationRepository.countInPeriod("date_debut", startOfThisMonth, now),
      this.formationRepository.countInPeriod("date_debut", startOfLastMonth, endOfLastPeriod),
    ]);

    let percent;
    if (previous === 0) {
      percent = current === 0 ? 0 : 100;
    } else {
      percent = ((current - previous) / previous) * 100;
    }
    const rounded = Math.round(percent);
    return {
      current,
      previous,
      trend: `${rounded >= 0 ? "+" : ""}${rounded}%`,
      trendUp: rounded >= 0,
    };
  }

  async getFormationWithCompetences(id) {
    return await this.formationRepository.findWithCompetences(id);
  }

  async validateFormationData(data, authHeader) {
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
      const prerequisErrors = await this.checkPrerequis(data.num_adherent, data.niveau_vise, authHeader);
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
  // requis pour s'inscrire à la formation visée. L'adhérent n'appartient
  // plus à ce service : récupéré via identite-service.
  async checkPrerequis(num_adherent, niveau_vise, authHeader) {
    const prerequis = PREREQUIS_FORMATION[niveau_vise];
    if (!prerequis) return [];

    const adherent = await identiteClient.getAdherentById(num_adherent, authHeader);
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

    // Dossier d'adhésion complet requis (Club, FFESM, Assurance RC) — même
    // règle que pour une inscription à une sortie (voir
    // InscriptionService.js côté activites-service). Adhesion vit dans
    // vie-associative-service : vérifiée par HTTP.
    const dossier = await vieAssociativeClient.checkDossierValidity(num_adherent, authHeader);
    if (!dossier.valid) {
      errors.push(`Dossier d'adhésion incomplet (manquant : ${dossier.missing.join(", ")})`);
    }

    return errors;
  }

  async create(data, user = null, authHeader = null) {
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
      const id_tresorier = await identiteClient.getTresorierIdForUser(user);
      await paiementClient.createLinkedPayment({
        num_adherent: data.num_adherent,
        montant: montantPaye,
        mode: data.mode || "Espèces",
        type_paiement: "Formation",
        reference_id: formation.id_formation,
        id_tresorier,
        description: `Formation ${data.niveau_vise}`,
      }, authHeader);
      await this.notifyPayment(formation, authHeader);
    }

    return formation;
  }

  async notifyPayment(formation, authHeader) {
    try {
      const adherent = await identiteClient.getAdherentById(formation.num_adherent, authHeader);
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

  // Ajoute un versement complémentaire (acompte/solde). Contrairement à la
  // version monolithe, la mise à jour du solde local et la création de la
  // ligne Paiement (chez finance-service) ne sont plus dans la même
  // transaction DB — c'est le compromis assumé du découpage en microservices
  // (voir "biggest risk" du plan) : on encaisse d'abord la confirmation de
  // finance-service (source de vérité du doublon), puis on met à jour notre
  // propre solde.
  async enregistrerPaiement(id_formation, { montant, mode, description }, user = null, authHeader = null) {
    if (!montant || montant <= 0) throw new Error("Le montant doit être supérieur à 0");

    const formation = await this.formationRepository.findById(id_formation);
    if (!formation) throw new Error("Formation non trouvée");
    if (!formation.montant_total) {
      throw new Error("Cette formation n'a pas de tarif à régler");
    }

    const id_tresorier = await identiteClient.getTresorierIdForUser(user);
    const { isDuplicate } = await paiementClient.createLinkedPayment({
      num_adherent: formation.num_adherent,
      montant,
      mode: mode || "Espèces",
      type_paiement: "Formation",
      reference_id: id_formation,
      id_tresorier,
      description: description || `Complément formation ${formation.niveau_vise}`,
    }, authHeader);

    if (isDuplicate) return formation;

    const nouveauMontantPaye = Number(formation.montant_paye || 0) + Number(montant);
    const statut_paiement = computeStatutPaiement(formation.montant_total, nouveauMontantPaye);
    const updated = await this.formationRepository.update(id_formation, {
      montant_paye: nouveauMontantPaye,
      statut_paiement,
    });

    await this.notifyPayment(updated, authHeader);

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

  // Ne peut terminer une formation que si toutes les compétences déjà
  // saisies sont acquises (check-list du CDC), puis répercute le niveau
  // obtenu sur l'adhérent (identite-service, résolu par HTTP) avant de
  // marquer la formation "Terminée" en local — l'appel externe est fait en
  // premier pour éviter une formation marquée terminée sans mise à jour du
  // niveau si identite-service est injoignable.
  async completeFormation(id, authHeader) {
    const formation = await this.getById(id);
    if (!formation) throw new Error("Formation non trouvée");

    const competences = await this.competenceRepository.findByFormation(id);
    const nonAcquises = competences.filter((c) => !c.acquise);
    if (nonAcquises.length > 0) {
      throw new Error(
        `Impossible de terminer la formation : ${nonAcquises.length} compétence(s) non validée(s) (${nonAcquises
          .map((c) => c.libelle)
          .join(", ")})`,
      );
    }

    const niveauObtenu = NIVEAU_OBTENU[formation.niveau_vise];
    if (niveauObtenu) {
      await identiteClient.updateNiveau(formation.num_adherent, niveauObtenu, authHeader);
    }

    formation.statut = "Terminée";
    await formation.save();
    return formation;
  }
}

module.exports = FormationService;
