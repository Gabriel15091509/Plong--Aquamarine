const BaseService = require("./BaseService");
const FormationRepository = require("../repositories/FormationRepository");
const CompetenceRepository = require("../repositories/CompetenceRepository");
const SeanceRepository = require("../repositories/SeanceRepository");
const identiteClient = require("../utils/serviceClients/identiteClient");
const paiementClient = require("../utils/serviceClients/paiementClient");
const vieAssociativeClient = require("../utils/serviceClients/vieAssociativeClient");
const activitesClient = require("../utils/serviceClients/activitesClient");
const { NIVEAU_ORDER, computeStatutPaiement } = require("../utils/roleScope");
const { sendFormationPaymentEmail } = require("../utils/email");
const { ForbiddenError } = require("../utils/errors");

// Prérequis indicatifs par niveau visé (niveau antérieur minimum, nombre de
// plongées minimum, profondeur minimum déjà atteinte en mètres, âge minimum)
// — valeurs raisonnables par défaut (repères FFESSM), ajustables.
// profondeurMin: null pour N1 (baptême/entrée en formation, pas de plongée
// autonome préalable exigée).
const PREREQUIS_FORMATION = {
  N1: { niveauMin: null, nbPlongeesMin: 6, profondeurMin: null, ageMin: 14 },
  N2: { niveauMin: "Niveau 1", nbPlongeesMin: 8, profondeurMin: 20, ageMin: 15 },
  N3: { niveauMin: "Niveau 2", nbPlongeesMin: 10, profondeurMin: 40, ageMin: 18 },
  N4: { niveauMin: "Niveau 3", nbPlongeesMin: 20, profondeurMin: 60, ageMin: 18 },
  MF1: { niveauMin: "Niveau 4", nbPlongeesMin: 150, profondeurMin: 60, ageMin: 18 },
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

// Spécialité d'encadrement requise pour superviser une formation visant ce
// niveau (voir Moniteur.specialites côté identite-service). MF1 n'a pas de
// spécialité "Encadrant" dédiée : seul le niveau du moniteur (case ci-dessous
// dans assertMoniteurQualifie) le distingue.
const SPECIALITE_ENCADREMENT_PAR_NIVEAU = {
  N1: "Encadrant N1",
  N2: "Encadrant N2",
  N3: "Encadrant N3",
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
    this.seanceRepository = new SeanceRepository();
  }

  async getAll() {
    return await this.formationRepository.findAll();
  }

  // Un adhérent ne doit voir que sa propre formation, jamais celle d'un
  // autre membre — les autres rôles (president/moniteur/tresorier) ne sont
  // pas concernés par cette restriction (getAdherentForUser renvoie null).
  async assertCanAccessFormation(formation, user) {
    const adherent = await identiteClient.getAdherentForUser(user);
    if (adherent && formation.num_adherent !== adherent.num_adherent) {
      throw new Error("Accès refusé à cette formation");
    }
  }

  async getById(id, user = null) {
    const formation = await this.formationRepository.findById(id);
    if (formation) await this.assertCanAccessFormation(formation, user);
    return formation;
  }

  // Un moniteur ne peut modifier, ajourner, terminer ou supprimer que les
  // formations qui lui sont assignées ; le président garde un accès total
  // (et le trésorier, restreint séparément pour l'enregistrement de
  // paiement) — résolu via getMoniteurByUserId, qui renvoie null si
  // l'utilisateur n'est pas moniteur.
  async assertCanModifyFormation(formation, user) {
    if (!user || user.role !== "moniteur") return;
    const moniteur = await identiteClient.getMoniteurByUserId(user.id);
    if (!moniteur || formation.id_moniteur !== moniteur.id_moniteur) {
      throw new ForbiddenError("Seul le moniteur assigné à cette formation peut la modifier");
    }
  }

  async getFormationsByAdherent(num_adherent, user = null) {
    const adherent = await identiteClient.getAdherentForUser(user);
    if (adherent && num_adherent !== adherent.num_adherent) {
      throw new Error("Accès refusé à ce suivi de formation");
    }
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

  async getFormationWithCompetences(id, user = null) {
    const formation = await this.formationRepository.findWithCompetences(id);
    if (formation) await this.assertCanAccessFormation(formation, user);
    return formation;
  }

  async validateFormationData(data, authHeader) {
    const errors = [];
    if (!data.num_adherent) errors.push("L'adhérent est requis");
    if (!data.id_moniteur) errors.push("Le moniteur est requis");
    if (!data.niveau_vise)  errors.push("Le niveau visé est requis");
    if (!data.date_debut)   errors.push("La date de début est requise");
    if (!data.date_fin_prevue) errors.push("La date de fin prévue est requise");
    if (!data.nb_seances_prevues || Number(data.nb_seances_prevues) <= 0) {
      errors.push("Le nombre de séances prévues est requis et doit être supérieur à 0");
    }
    if (data.date_debut && data.date_fin_prevue) {
      if (new Date(data.date_fin_prevue) <= new Date(data.date_debut)) {
        errors.push("La date de fin doit être postérieure à la date de début");
      }
    }

    if (data.num_adherent && data.niveau_vise) {
      const prerequisErrors = await this.checkPrerequis(data.num_adherent, data.niveau_vise, authHeader);
      errors.push(...prerequisErrors);
    }

    if (data.id_moniteur && data.niveau_vise) {
      const moniteurErrors = await this.assertMoniteurQualifie(data.id_moniteur, data.niveau_vise, authHeader);
      errors.push(...moniteurErrors);
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

    // Le niveau visé doit faire progresser l'adhérent, jamais répéter ou
    // redescendre sous ce qu'il a déjà : niveauMin ci-dessus ne garantit
    // qu'un plancher (ex. N4 exige au moins Niveau 3), rien n'empêchait par
    // ailleurs d'inscrire un Niveau 3 à une formation N1, ou un Niveau 2 à
    // une nouvelle formation N2 qu'il possède déjà. Comparé via NIVEAU_ORDER
    // (même échelle que niveau_vise une fois traduit par NIVEAU_OBTENU,
    // ex. "N2" -> "Niveau 2") plutôt qu'une égalité de chaîne, qui aurait
    // toujours échoué silencieusement ("N2" !== "Niveau 2"). Un adhérent
    // sans niveau connu (adherent.niveau null, jamais licencié) n'est
    // jamais bloqué ici : indexOf(null) vaut -1, la comparaison est
    // ignorée.
    const niveauViseComplet = NIVEAU_OBTENU[niveau_vise];
    if (niveauViseComplet) {
      const indexActuel = NIVEAU_ORDER.indexOf(adherent.niveau);
      const indexVise = NIVEAU_ORDER.indexOf(niveauViseComplet);
      if (indexActuel !== -1 && indexVise !== -1 && indexVise <= indexActuel) {
        errors.push(
          `L'adhérent a déjà le niveau ${adherent.niveau} : le niveau visé (${niveauViseComplet}) doit être strictement supérieur`,
        );
      }
    }
    if ((adherent.nb_plongees_total || 0) < prerequis.nbPlongeesMin) {
      errors.push(`Nombre de plongées insuffisant (minimum requis : ${prerequis.nbPlongeesMin})`);
    }
    if (prerequis.profondeurMin) {
      const profondeurMax = await activitesClient.getProfondeurMaxAdherent(num_adherent, authHeader);
      if (profondeurMax < prerequis.profondeurMin) {
        errors.push(`Profondeur insuffisante (minimum déjà atteint requis : ${prerequis.profondeurMin} m)`);
      }
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

  // Vérifie que le moniteur affecté existe réellement (identite-service) et
  // qu'il est qualifié pour encadrer le niveau visé : une formation MF1
  // (former de futurs moniteurs) exige un moniteur déjà de niveau "Moniteur",
  // pas seulement "Niveau 4" ; N1/N2/N3 exigent la spécialité d'encadrement
  // correspondante déclarée sur sa fiche.
  async assertMoniteurQualifie(id_moniteur, niveau_vise, authHeader) {
    const moniteur = await identiteClient.getMoniteurById(id_moniteur, authHeader);
    if (!moniteur) return ["Moniteur introuvable"];

    const errors = [];
    if (niveau_vise === "MF1" && moniteur.niveau !== "Moniteur") {
      errors.push('Seul un moniteur de niveau "Moniteur" peut encadrer une formation MF1');
    }

    const specialiteRequise = SPECIALITE_ENCADREMENT_PAR_NIVEAU[niveau_vise];
    if (specialiteRequise && !(moniteur.specialites || []).includes(specialiteRequise)) {
      errors.push(`Ce moniteur n'a pas la spécialité d'encadrement requise (${specialiteRequise})`);
    }

    return errors;
  }

  async create(data, user = null, authHeader = null) {
    const montantTotal =
      data.montant_total !== undefined && data.montant_total !== null && data.montant_total !== ""
        ? Number(data.montant_total)
        : null;

    if (!montantTotal || montantTotal <= 0) {
      const formationGratuite = await this.formationRepository.create({
        ...data,
        montant_total: null,
        montant_paye: 0,
        statut_paiement: "Payé",
      });
      await this.syncAdherentStatutFormation(formationGratuite.num_adherent, authHeader);
      return formationGratuite;
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
    await this.syncAdherentStatutFormation(formation.num_adherent, authHeader);

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
  async update(id, data, user = null, authHeader = null) {
    const formation = await this.formationRepository.findById(id);
    if (!formation) throw new Error("Formation non trouvée");
    await this.assertCanModifyFormation(formation, user);

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

    // "Terminée" ne doit être atteignable que via completeFormation (PATCH
    // /:id/complete) : c'est le seul chemin qui vérifie que les séances
    // prévues sont réalisées et les compétences acquises, et qui répercute
    // le niveau obtenu sur l'adhérent (identiteClient.updateNiveau). Un
    // passage par cette route générique laissait jusqu'ici une formation se
    // déclarer "Terminée" avec des séances encore "Planifiée" et sans
    // jamais promouvoir l'adhérent.
    if (nextStatut === "Terminée" && formation.statut !== "Terminée") {
      throw new Error(
        'Utilisez l\'action "Terminer la formation" pour clôturer une formation (elle vérifie les séances et compétences requises).',
      );
    }

    // nb_seances_realisees n'est plus une saisie libre : elle ne doit
    // refléter que les séances réellement marquées "Réalisée" (seul
    // SeanceService.updateStatut l'incrémente). Une valeur envoyée ici par
    // le client serait déconnectée des vraies séances et fausserait la
    // progression affichée (FormationDetails.jsx) — ignorée silencieusement
    // plutôt que rejetée, pour ne pas faire échouer une édition qui renvoie
    // simplement le formulaire tel quel.
    const { nb_seances_realisees, ...safeData } = data;

    // nb_seances_prevues peut être ajusté (ex. programme rallongé), mais
    // jamais en dessous du nombre de séances déjà créées : sinon la
    // progression afficherait plus de 100% et le garde-fou de création de
    // séance (SeanceService.validateSeanceData) deviendrait incohérent.
    if (
      safeData.nb_seances_prevues !== undefined &&
      safeData.nb_seances_prevues !== null &&
      safeData.nb_seances_prevues !== ""
    ) {
      const seancesExistantes = await this.seanceRepository.findByFormation(id);
      if (Number(safeData.nb_seances_prevues) < seancesExistantes.length) {
        throw new Error(
          `Le nombre de séances prévues ne peut pas être inférieur au nombre de séances déjà créées (${seancesExistantes.length})`,
        );
      }
    }

    const updated = await this.formationRepository.update(id, safeData);
    if (nextStatut !== formation.statut) {
      await this.syncAdherentStatutFormation(formation.num_adherent, authHeader);
    }
    return updated;
  }

  // Ne peut terminer une formation que si toutes les compétences déjà
  // saisies sont acquises (check-list du CDC), puis répercute le niveau
  // obtenu sur l'adhérent (identite-service, résolu par HTTP) avant de
  // marquer la formation "Terminée" en local — l'appel externe est fait en
  // premier pour éviter une formation marquée terminée sans mise à jour du
  // niveau si identite-service est injoignable.
  // `brevetInfo` (num_brevet/num_licence_ffesm) est optionnel : renseigné par
  // le moniteur/président au moment de la validation manuelle (le formulaire
  // "Terminer" les propose), absent lors d'un passage automatique
  // (tryAutoComplete) où personne ne connaît encore les numéros délivrés.
  async completeFormation(id, authHeader, brevetInfo = {}, user = null) {
    const formation = await this.getById(id);
    if (!formation) throw new Error("Formation non trouvée");
    await this.assertCanModifyFormation(formation, user);

    if (
      formation.nb_seances_prevues &&
      formation.nb_seances_realisees < formation.nb_seances_prevues
    ) {
      throw new Error(
        `Impossible de terminer la formation : ${formation.nb_seances_realisees}/${formation.nb_seances_prevues} séances réalisées`,
      );
    }

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
      await identiteClient.updateNiveau(formation.num_adherent, niveauObtenu, brevetInfo, authHeader);
    }

    formation.statut = "Terminée";
    await formation.save();
    await this.syncAdherentStatutFormation(formation.num_adherent, authHeader);
    return formation;
  }

  // Le moniteur garde la main pour retenir un adhérent qui n'a pas le niveau
  // malgré les séances/compétences cochées, plutôt que de laisser la
  // complétion automatique (tryAutoComplete) attribuer le niveau à sa place.
  async ajourner(id, motif, user = null, authHeader = null) {
    const formation = await this.formationRepository.findById(id);
    if (!formation) throw new Error("Formation non trouvée");
    await this.assertCanModifyFormation(formation, user);
    if (formation.statut !== "En cours") {
      throw new Error("Seule une formation en cours peut être ajournée");
    }
    if (!motif) throw new Error("Le motif de l'ajournement est requis");

    formation.statut = "Ajournée";
    formation.commentaire_moniteur = motif;
    await formation.save();
    await this.syncAdherentStatutFormation(formation.num_adherent, authHeader);
    return formation;
  }

  async delete(id, user = null, authHeader = null) {
    const formation = await this.formationRepository.findById(id);
    if (!formation) throw new Error("Formation non trouvée");
    await this.assertCanModifyFormation(formation, user);
    const result = await this.formationRepository.delete(id);
    if (formation.statut === "En cours") {
      await this.syncAdherentStatutFormation(formation.num_adherent, authHeader);
    }
    return result;
  }

  // Détermine si l'adhérent a encore au moins une formation "En cours" et
  // répercute ce fait sur Adherent.statut (identite-service) — même
  // principe que la synchro du niveau (identiteClient.updateNiveau), mais
  // pour un simple booléen indépendant de la formation qui vient de
  // changer : une formation qui se termine/s'abandonne/s'ajourne/se
  // supprime ne doit pas faire sortir l'adhérent de "En formation" s'il en
  // a une autre encore "En cours" en parallèle. Best-effort (comme
  // notifyPayment) : ne doit jamais faire échouer l'opération de formation
  // qui vient de réussir si identite-service est injoignable.
  async syncAdherentStatutFormation(num_adherent, authHeader) {
    try {
      const formations = await this.formationRepository.findByAdherent(num_adherent);
      const enFormation = formations.some((f) => f.statut === "En cours");
      await identiteClient.syncStatutFormation(num_adherent, enFormation, authHeader);
    } catch (error) {
      console.error("Erreur synchronisation statut adhérent (En formation):", error.message);
    }
  }

  // Appelé après qu'une séance passe à "Réalisée" (SeanceService.updateStatut)
  // ou qu'une compétence soit validée (CompetenceService.valider) : dès que
  // les deux conditions sont réunies (séances prévues atteintes + toutes les
  // compétences acquises), la formation se termine seule et le niveau est
  // attribué, sans clic du moniteur. Ne s'applique pas aux formations sans
  // nb_seances_prevues connu (créées avant ce champ) ni sans aucune
  // compétence saisie (sinon "aucune non-acquise" serait vrai trivialement).
  // Best-effort côté appelants : ne doit jamais faire échouer l'action qui
  // vient de se produire (marquage de séance ou de compétence).
  async tryAutoComplete(id_formation, authHeader) {
    const formation = await this.formationRepository.findById(id_formation);
    if (!formation || formation.statut !== "En cours") return null;
    if (!formation.nb_seances_prevues) return null;
    if (formation.nb_seances_realisees < formation.nb_seances_prevues) return null;

    const competences = await this.competenceRepository.findByFormation(id_formation);
    if (competences.length === 0 || competences.some((c) => !c.acquise)) return null;

    return await this.completeFormation(id_formation, authHeader);
  }

}

module.exports = FormationService;
