const { sequelize } = require("../models");
const BaseService = require("./BaseService");
const InscriptionRepository = require("../repositories/InscriptionRepository");
const SortieService = require("./SortieService");
const paiementClient = require("../utils/serviceClients/paiementClient");
const vieAssociativeClient = require("../utils/serviceClients/vieAssociativeClient");
const identiteClient = require("../utils/serviceClients/identiteClient");
const InscriptionWaitlistService = require("./InscriptionWaitlistService");
const { isNiveauCompatible } = require("../utils/roleScope");
const { withAdherent } = require("../utils/enrichAdherents");
const {
  getAge,
  checkBaptemeDepthForAge,
  isSameCalendarDay,
  AGE_LIMITE_UNE_PLONGEE_PAR_JOUR,
} = require("../utils/ageRules");
const { sortiesSeChevauchent } = require("../utils/sortieOverlap");
const { computeMontantDu } = require("../utils/tarifRules");
const {
  sendInscriptionConfirmationEmail,
  sendInscriptionPaymentEmail,
} = require("../utils/email");

function formatSortieLabel(sortie) {
  const date = sortie?.date_heure
    ? new Date(sortie.date_heure).toLocaleDateString("fr-FR")
    : "";
  return `${sortie?.site || sortie?.lieu || "Sortie"} du ${date}`;
}

class InscriptionService extends BaseService {
  constructor() {
    const repository = new InscriptionRepository();
    super(repository);
    this.inscriptionRepository = repository;
    this.sortieService = new SortieService();
    this.waitlistService = new InscriptionWaitlistService(
      repository,
      this.sortieService,
    );
  }

  canManageInscriptions(role) {
    return ["president", "moniteur", "tresorier"].includes(role);
  }

  // Adherent vit dans identite-service (autre process) : résolu par HTTP au
  // lieu d'un `Adherent.findOne` local.
  async getAdherentForUser(user) {
    if (!user || this.canManageInscriptions(user.role)) return null;
    const adherent = await identiteClient.getAdherentForUser(user);
    if (!adherent) {
      throw new Error("Profil adhérent introuvable pour cet utilisateur");
    }
    return adherent;
  }

  async assertCanAccessInscription(inscription, user) {
    if (this.canManageInscriptions(user?.role)) return;
    const adherent = await this.getAdherentForUser(user);
    if (inscription.num_adherent !== adherent.num_adherent) {
      throw new Error("Accès refusé à cette inscription");
    }
  }

  // Un moniteur ne peut GÉRER (confirmer/annuler/supprimer/modifier le
  // statut ou la présence) QUE les inscriptions des sorties où il est
  // lui-même désigné encadrant (Sortie.encadrants, choisi par le président à
  // la planification) — le président et le trésorier gardent un accès total
  // (le trésorier n'encadre jamais de sortie lui-même, sa gestion des
  // inscriptions relève du suivi des paiements, pas de l'encadrement
  // terrain). Même garde-fou que SortieService.assertCanManageSortie /
  // PlongeeService.assertCanManagePlongee, appliqué ici aux ACTIONS sur une
  // inscription EXISTANTE seulement (pas à createInscription, qui reste
  // ouverte à tout moniteur — préinscrire un adhérent au guichet ne
  // présuppose pas d'être l'encadrant désigné de sa sortie). Avant ce
  // correctif, canManageInscriptions (rôle générique) ouvrait ces actions à
  // n'importe quel moniteur sur n'importe quelle inscription, y compris
  // celles d'une sortie confiée à un autre.
  //
  // `inscription.sortie` doit être chargée (voir InscriptionRepository.
  // findById, qui l'inclut déjà par défaut) — Sortie vit dans ce même
  // service/schéma que Inscription, pas d'appel HTTP nécessaire pour lire
  // ses encadrants, contrairement au moniteur lui-même (identite-service).
  async assertCanManageInscription(inscription, user) {
    if (!user || user.role === "president" || user.role === "tresorier") return;
    if (user.role !== "moniteur") {
      throw new Error(
        "Seuls le président, le trésorier ou un moniteur désigné encadrant de cette sortie peuvent gérer cette inscription",
      );
    }
    const moniteur = await identiteClient.getMoniteurByUserId(user.id);
    const encadrants = inscription.sortie?.encadrants;
    const estEncadrantDesigne =
      moniteur && Array.isArray(encadrants) && encadrants.includes(moniteur.id_moniteur);
    if (!estEncadrantDesigne) {
      throw new Error(
        "Seul le président, le trésorier ou un moniteur désigné encadrant de cette sortie peut gérer cette inscription",
      );
    }
  }

  async getByAdherent(num_adherent) {
    return await this.inscriptionRepository.findByAdherent(num_adherent);
  }

  // Un moniteur ne voit que les inscriptions des sorties dont il est
  // désigné encadrant (Sortie.encadrants) — comme pour la gestion
  // (assertCanManageInscription) ; le président et le trésorier voient tout,
  // un adhérent ses propres inscriptions. Un moniteur sans fiche
  // identifiable ne voit rien.
  async filterForMoniteur(inscriptions, user) {
    const moniteur = await identiteClient.getMoniteurByUserId(user.id);
    if (!moniteur) return [];
    return inscriptions.filter(
      (i) =>
        Array.isArray(i.sortie?.encadrants) && i.sortie.encadrants.includes(moniteur.id_moniteur),
    );
  }

  // Recomposer `.adherent` sur chaque ligne coûte un appel HTTP par
  // adhérent distinct vers identite-service (des centaines pour la liste
  // complète, ~3 s et une réponse de plusieurs Mo) — or la liste des
  // inscriptions n'en a pas besoin : le frontend résout les noms depuis la
  // liste des adhérents qu'il charge déjà. Donc opt-in (`withAdherentInfo`,
  // ?include_adherent=true côté route), et jamais bloquant : si
  // identite-service échoue sur un adhérent, la liste ne devient plus vide.
  async getAll(user = null, authHeader = null, { withAdherentInfo = false } = {}) {
    try {
      const adherent = await this.getAdherentForUser(user);
      let results = adherent
        ? await this.inscriptionRepository.findByAdherent(adherent.num_adherent)
        : await this.inscriptionRepository.findAll();
      if (!adherent && user?.role === "moniteur") {
        results = await this.filterForMoniteur(results, user);
      }
      if (!withAdherentInfo) return results.map((r) => (r?.toJSON ? r.toJSON() : r));
      return await withAdherent(results, { authHeader });
    } catch (error) {
      console.error("Erreur lors de la récupération des inscriptions :", error);
      return [];
    }
  }

  // Compteur "nouvelles inscriptions" du badge Sidebar.jsx — réservé au
  // staff (président/moniteur, voir canManageInscriptionsBadge côté
  // frontend), jamais appelé pour un simple adhérent. this.getAll() ci-
  // dessus charge TOUTES les inscriptions puis recompose `.adherent` de
  // chacune par HTTP (withAdherent) rien que pour ensuite les jeter et n'en
  // garder que la longueur filtrée par statut — sur un club avec un peu
  // d'historique (des centaines d'inscriptions, autant d'adhérents
  // distincts), cet appel à lui seul dépassait 8s et, avec la limite de 6
  // connexions/origine de Chrome, mettait en file d'attente toutes les
  // autres requêtes de la page derrière lui (dont /api/plongees, /api/
  // sorties...) sur CHAQUE page de l'appli (la Sidebar est toujours montée).
  // Un simple COUNT ne nécessite ni les lignes ni identite-service.
  // Pour un moniteur, seules comptent les inscriptions de ses sorties (même
  // périmètre que getAll) : sinon le badge afficherait des demandes qu'il ne
  // voit ni ne peut traiter.
  async getPendingCount(user = null) {
    if (user?.role === "moniteur") {
      const pending = await this.inscriptionRepository.findPending();
      return (await this.filterForMoniteur(pending, user)).length;
    }
    return await this.inscriptionRepository.countPending();
  }

  async getById(id, user = null) {
    try {
      const inscription = await this.inscriptionRepository.findById(id);
      if (inscription && user) {
        await this.assertCanAccessInscription(inscription, user);
      }
      return inscription;
    } catch (error) {
      console.error(`Erreur lors de la récupération de l'inscription ${id} :`, error);
      return null;
    }
  }

  async delete(id, user = null, authHeader = null) {
    try {
      const inscription = await this.getById(id);
      if (!inscription) throw new Error("Inscription non trouvée");
      if (!this.canManageInscriptions(user?.role)) {
        throw new Error("Seul un gestionnaire peut supprimer une inscription");
      }
      await this.assertCanManageInscription(inscription, user);

      const oldStatus = inscription.statut;
      const idSortie = inscription.id_sortie;
      await this.inscriptionRepository.delete(id);

      if (oldStatus === "Confirmée") {
        await this.waitlistService.promoteNextFromWaitlist(idSortie, authHeader);
      } else if (oldStatus === "Liste d'attente") {
        await this.waitlistService.normalizeWaitlistRanks(idSortie);
      }

      return true;
    } catch (error) {
      console.error(`Erreur lors de la suppression de l'inscription ${id} :`, error);
      throw error;
    }
  }

  async update(id, data) {
    const inscription = await this.inscriptionRepository.findById(id);
    if (!inscription) {
      throw new Error("Inscription non trouvée");
    }

    const canManage = this.canManageInscriptions(data.role);
    if (canManage) {
      await this.assertCanManageInscription(inscription, data.user);
    } else {
      await this.assertCanAccessInscription(inscription, data.user);
    }
    const managerFields = [
      "statut",
      "presence",
      "presence_checked",
      "presence_check_time",
      "presence_check_by",
      "absence_reason",
      "absence_justified",
      "rang_liste_attente",
      "date_confirmation",
    ];
    const allowedFields = canManage ? managerFields : [];

    const oldStatus = inscription.statut;
    const nextStatus = data.statut;
    const statusWillChange =
      nextStatus !== undefined && nextStatus !== oldStatus;
    if (!canManage && statusWillChange && nextStatus !== "Annulée") {
      throw new Error("Un adhérent ne peut pas modifier le statut de son inscription");
    }

    // Sortie annulée : plus aucune confirmation/mise en liste d'attente ni
    // aucun pointage de présence ne doit pouvoir être enregistré via cette
    // route générique (utilisée par la mise en liste d'attente et, en
    // dehors du flux dédié SortiePointage/enregistrerPointage, par toute
    // écriture directe des champs de présence). Annuler reste toujours
    // permis (idempotent, sans effet nuisible).
    if (canManage && inscription.sortie?.statut === "Annulée") {
      const toucheConfirmationOuPresence =
        (statusWillChange && ["Confirmée", "Liste d'attente"].includes(nextStatus)) ||
        data.presence !== undefined ||
        data.presence_checked !== undefined;
      if (toucheConfirmationOuPresence) {
        throw new Error(
          "Cette sortie est annulée : confirmation et pointage de présence impossibles",
        );
      }
    }

    const updateData = {};
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }
    if (!canManage && nextStatus === "Annulée") {
      updateData.statut = "Annulée";
    }

    if (statusWillChange && nextStatus === "Liste d'attente") {
      updateData.rang_liste_attente = await this.waitlistService.getNextWaitlistRank(
        inscription.id_sortie,
        id,
      );
      updateData.date_confirmation = null;
    }

    if (statusWillChange && nextStatus === "Annulée") {
      updateData.rang_liste_attente = null;
    }

    let updated;
    if (statusWillChange && nextStatus === "Confirmée") {
      // Capacité lue et écriture faites sous le même verrou sur la sortie —
      // voir le raisonnement dans createInscription.
      updated = await sequelize.transaction(async (transaction) => {
        const { placesDisponibles } = await this.waitlistService.getSortieCapacityLocked(
          inscription.id_sortie,
          id,
          transaction,
        );
        if (placesDisponibles <= 0) {
          throw new Error("Plus de places disponibles");
        }
        await this.assertNoConfirmedOverlap(inscription.num_adherent, inscription.sortie, id);
        updateData.rang_liste_attente = null;
        updateData.date_confirmation = updateData.date_confirmation || new Date();
        return await this.inscriptionRepository.update(id, updateData, { transaction });
      });
      await this.waitlistService.cancelOverlappingOthers(
        inscription.num_adherent,
        inscription.sortie,
        id,
      );
    } else {
      updated = await this.inscriptionRepository.update(id, updateData);
    }

    if (statusWillChange && oldStatus === "Confirmée") {
      await this.waitlistService.promoteNextFromWaitlist(inscription.id_sortie, data.authHeader);
    } else if (
      statusWillChange &&
      (oldStatus === "Liste d'attente" || nextStatus === "Liste d'attente")
    ) {
      await this.waitlistService.normalizeWaitlistRanks(inscription.id_sortie);
    }

    return updated;
  }

  async getCapacityBySortie(id_sortie, authHeader = null) {
    return await this.waitlistService.getCapacityBySortie(id_sortie, authHeader);
  }

  async getConfirmationsBySortie(id_sortie, user = null, onlyPresent = false, authHeader = null) {
    const results = await this.inscriptionRepository.findConfirmationsBySortie(
      id_sortie,
    );
    const filtered = onlyPresent
      ? results.filter((i) => i.presence && i.presence_checked)
      : results;
    const adherent = await this.getAdherentForUser(user);
    const scoped = adherent
      ? filtered.filter((inscription) => inscription.num_adherent === adherent.num_adherent)
      : filtered;
    return await withAdherent(scoped, { authHeader });
  }

  async getByAdherentAndSortie(num_adherent, id_sortie, user = null) {
    const adherent = await this.getAdherentForUser(user);
    if (adherent && num_adherent !== adherent.num_adherent) {
      throw new Error("Accès refusé à cette inscription");
    }
    return await this.inscriptionRepository.findByAdherentAndSortie(
      num_adherent,
      id_sortie,
    );
  }

  async getWaitlistBySortie(id_sortie, user = null) {
    const results = await this.waitlistService.getWaitlistBySortie(id_sortie);
    const adherent = await this.getAdherentForUser(user);
    if (!adherent) return results;
    return results.filter(
      (inscription) => inscription.num_adherent === adherent.num_adherent,
    );
  }

  async getInscriptionStats(user = null) {
    try {
      const adherent = await this.getAdherentForUser(user);
      if (adherent) {
        return await this.inscriptionRepository.getInscriptionStatsByAdherent(
          adherent.num_adherent,
        );
      }
      return await this.inscriptionRepository.getInscriptionStats();
    } catch (error) {
      console.error("Erreur lors du calcul des statistiques d'inscription :", error);
      return {
        total: 0,
        enAttente: 0,
        confirmees: 0,
        annulees: 0,
        listeAttente: 0,
      };
    }
  }

  // Un adhérent ne peut pas avoir deux inscriptions "Confirmée" dont les
  // sorties se chevauchent dans le temps (impossible d'être sur deux
  // plongées en même temps). Volontairement limité aux inscriptions
  // Confirmée : "En attente"/"Liste d'attente" ne réservent rien de réel,
  // donc ne bloquent pas. excludeInscriptionId sert quand on (re)confirme
  // une inscription déjà existante, pour ne pas se comparer à elle-même.
  async assertNoConfirmedOverlap(num_adherent, sortie, excludeInscriptionId = null) {
    const autresInscriptions = await this.inscriptionRepository.findByAdherent(num_adherent);
    const conflit = autresInscriptions.find(
      (i) =>
        i.statut === "Confirmée" &&
        i.id_inscription !== excludeInscriptionId &&
        i.sortie &&
        i.sortie.id_sortie !== sortie.id_sortie &&
        sortiesSeChevauchent(i.sortie, sortie),
    );
    if (conflit) {
      throw new Error(
        `Cet adhérent a déjà une inscription confirmée qui chevauche cette sortie (${formatSortieLabel(conflit.sortie)})`,
      );
    }
  }

  async createInscription(data) {
    if (!data.num_adherent) {
      throw new Error("L'adhérent est requis");
    }
    if (!data.id_sortie) {
      throw new Error("La sortie est requise");
    }

    const num_adherent = data.num_adherent;
    const id_sortie = parseInt(data.id_sortie);
    const canManage = this.canManageInscriptions(data.role);
    if (!canManage) {
      const adherent = await this.getAdherentForUser(data.user);
      if (num_adherent !== adherent.num_adherent) {
        throw new Error("Un adhérent ne peut créer que sa propre inscription");
      }
    }

    const existing = await this.getByAdherentAndSortie(num_adherent, id_sortie);
    if (existing) {
      throw new Error("Cet adhérent est déjà inscrit à cette sortie");
    }

    // getById (pas getSortieDetails) : seuls des champs propres à la Sortie
    // (statut, dates, niveau_requis, profondeur_max, type) sont nécessaires
    // ci-dessous, jamais `.inscriptions` enrichies. getSortieDetails
    // recompose par HTTP l'adhérent de chaque inscription existante de la
    // sortie — un aller-retour inutile ici qui, si identite-service est
    // indisponible, fait échouer toute nouvelle inscription avec une
    // erreur réseau générique au lieu du message métier attendu (ex :
    // "Cette sortie est annulée").
    const sortie = await this.sortieService.getById(id_sortie);
    if (!sortie) {
      throw new Error("Sortie non trouvée");
    }

    if (sortie.statut === "Annulée") {
      throw new Error("Cette sortie est annulée");
    }

    // On ne peut s'inscrire qu'à une sortie encore au stade "Planifiée" :
    // une fois "En cours"/"Terminée", les inscriptions n'ont plus de sens.
    if (sortie.statut !== "Planifiée") {
      throw new Error(
        "Les inscriptions ne sont possibles que pour une sortie planifiée",
      );
    }

    // Une sortie reste "Planifiée" tant que personne ne l'a fait avancer
    // manuellement (pas de cron qui bascule le statut au passage de la
    // date) : le contrôle ci-dessus ne suffit donc pas à lui seul à bloquer
    // une inscription après coup. Miroir du garde-fou frontend
    // (SortiesPage.isPastSortie) — sans ce contrôle, l'API restait
    // ouverte à l'inscription sur une sortie déjà passée en appelant la
    // route directement.
    if (new Date(sortie.date_heure) < new Date()) {
      throw new Error("Cette sortie a déjà eu lieu : inscription impossible");
    }

    // Les inscriptions autonomes ne sont ouvertes qu'à partir de la date
    // fixée sur la sortie (ex : 7 jours avant) ; le directeur technique/staff
    // (canManage) peut en revanche préinscrire un adhérent avant cette date.
    if (
      !canManage &&
      sortie.date_ouverture_inscriptions &&
      new Date() < new Date(sortie.date_ouverture_inscriptions)
    ) {
      throw new Error(
        `Les inscriptions ouvrent le ${new Date(sortie.date_ouverture_inscriptions).toLocaleDateString("fr-FR")}`,
      );
    }

    // Le niveau de l'adhérent doit être suffisant pour cette sortie.
    // Adherent vit dans identite-service : résolu par HTTP. Récupéré avant
    // le contrôle du dossier car un niveau Baptême en allège les exigences.
    const adherentRecord = await identiteClient.getAdherentById(num_adherent, data.authHeader);
    if (!isNiveauCompatible(adherentRecord?.niveau, sortie.niveau_requis)) {
      throw new Error("Niveau insuffisant pour cette sortie");
    }

    // RG7 : un Niveau 1 ne peut pas plonger au-delà de 20m (réglementation).
    // niveau_requis garantit un niveau minimum, pas un plafond — une sortie
    // ouverte au Niveau 1 peut très bien afficher une profondeur_max > 20m
    // pour les plongeurs plus expérimentés du même groupe.
    if (adherentRecord?.niveau === "Niveau 1" && Number(sortie.profondeur_max) > 20) {
      throw new Error(
        "Un plongeur Niveau 1 ne peut pas s'inscrire à une sortie prévue au-delà de 20m (réglementation)",
      );
    }

    // Règles d'âge (Code du Sport) : profondeur max d'un baptême selon
    // l'âge, et une seule plongée par jour avant 12 ans — voir utils/
    // ageRules.js pour le détail des textes. L'âge inconnu ne bloque jamais
    // (checkBaptemeDepthForAge renvoie null), seule une violation avérée le
    // fait.
    const age = getAge(adherentRecord?.date_naissance, new Date(sortie.date_heure));
    if (sortie.type === "Baptême") {
      const ageError = checkBaptemeDepthForAge(age, sortie.profondeur_max);
      if (ageError) throw new Error(ageError);
    }
    if (age !== null && age < AGE_LIMITE_UNE_PLONGEE_PAR_JOUR) {
      const autresInscriptions = await this.inscriptionRepository.findByAdherent(num_adherent);
      const dejaUnePlongeeCeJourLa = autresInscriptions.some(
        (i) =>
          i.statut !== "Annulée" &&
          i.sortie &&
          isSameCalendarDay(i.sortie.date_heure, sortie.date_heure),
      );
      if (dejaUnePlongeeCeJourLa) {
        throw new Error(
          `Un enfant de moins de ${AGE_LIMITE_UNE_PLONGEE_PAR_JOUR} ans ne peut faire qu'une plongée par jour`,
        );
      }
    }

    // Un adhérent ne peut pas s'inscrire si son adhésion n'est pas
    // valide ou si son certificat médical est expiré/manquant — règle de
    // sécurité, appliquée quel que soit l'auteur de l'inscription (staff ou
    // adhérent lui-même). Adhesion et CertificatMedical vivent dans
    // vie-associative-service : vérifiés par HTTP.
    // Un Baptême n'est pas encore licencié FFESM ni assuré à l'année : seule
    // l'adhésion Club est exigée pour ce niveau.
    const requiredTypes = adherentRecord?.niveau === "Baptême" ? ["Club"] : undefined;
    const dossier = await vieAssociativeClient.checkDossierValidity(num_adherent, data.authHeader, requiredTypes);
    if (!dossier.valid) {
      throw new Error(
        `Adhésion incomplète (manquant : ${dossier.missing.join(", ")})`,
      );
    }
    const certStatus = await vieAssociativeClient.checkCertificateStatus(num_adherent, data.authHeader);
    if (!certStatus.hasValidCertificate) {
      throw new Error("Le certificat médical est expiré ou manquant");
    }

    // Le tarif de la sortie est figé au moment de l'inscription : un
    // changement de tarif ultérieur sur la sortie ne doit pas modifier
    // rétroactivement ce qui est dû par les inscrits déjà enregistrés.
    // adherentRecord (résolu plus haut pour le contrôle de niveau) porte
    // est_invite : un invité (CDC 3.2.1) paie le tarif non-adhérent.
    const montantDu = computeMontantDu(sortie, adherentRecord);
    const baseInscriptionData = {
      num_adherent,
      id_sortie,
      presence: data.presence || false,
      montant_du: montantDu,
      montant_paye: 0,
      paye: montantDu <= 0,
    };

    // Un moniteur peut préinscrire un adhérent même s'il n'est pas
    // l'encadrant désigné de cette sortie (voir assertCanManageInscription
    // plus haut — createInscription reste volontairement ouverte à tout
    // moniteur), mais il ne peut alors PAS choisir le statut : seul le
    // président/trésorier, ou le moniteur désigné encadrant de CETTE
    // sortie, peut confirmer/placer en liste d'attente directement. Sans ce
    // verrou, n'importe quel moniteur pourrait confirmer une inscription
    // sur une sortie qu'il n'encadre pas, court-circuitant l'encadrant
    // réellement responsable de la capacité/composition de palanquées.
    let statutForceEnAttente = false;
    if (canManage && data.role === "moniteur") {
      const moniteur = await identiteClient.getMoniteurByUserId(data.user?.id);
      const estEncadrantDesigne =
        moniteur &&
        Array.isArray(sortie.encadrants) &&
        sortie.encadrants.includes(moniteur.id_moniteur);
      if (!estEncadrantDesigne) {
        statutForceEnAttente = true;
      }
    }

    let inscription;
    if (!canManage) {
      // Auto-inscription : toujours "En attente" quelle que soit la
      // capacité restante — un adhérent ne peut ni s'auto-confirmer ni
      // s'auto-placer en liste d'attente, seul un gestionnaire décide
      // ensuite (confirmInscription/update). Aucune place n'est comptée
      // avant cette décision : pas besoin de verrouiller la sortie ici.
      inscription = await this.inscriptionRepository.create({
        ...baseInscriptionData,
        statut: "En attente",
        rang_liste_attente: null,
        date_confirmation: null,
      });
    } else {
      // Préinscription par un gestionnaire : la capacité doit être lue ET
      // l'inscription écrite sous le même verrou posé sur la ligne de la
      // sortie (voir InscriptionWaitlistService.getSortieCapacityLocked) —
      // sans ça, deux préinscriptions "Confirmée" concurrentes pour la
      // dernière place peuvent toutes les deux lire "1 place disponible" et
      // toutes les deux réussir, faisant déborder nb_inscrits au-dessus de
      // nb_places.
      inscription = await sequelize.transaction(async (transaction) => {
        const { placesDisponibles } = await this.waitlistService.getSortieCapacityLocked(
          id_sortie,
          null,
          transaction,
        );

        let statut = statutForceEnAttente ? "En attente" : data.statut || "Confirmée";
        let rangListeAttente = null;

        if (placesDisponibles <= 0 && statut !== "En attente") {
          statut = "Liste d'attente";
        }
        if (statut === "Liste d'attente") {
          rangListeAttente = await this.waitlistService.getNextWaitlistRank(id_sortie);
        }
        if (statut === "Confirmée") {
          await this.assertNoConfirmedOverlap(num_adherent, sortie);
        }

        return await this.inscriptionRepository.create(
          {
            ...baseInscriptionData,
            statut,
            rang_liste_attente: rangListeAttente,
            date_confirmation:
              data.date_confirmation || (statut === "Confirmée" ? new Date() : null),
          },
          { transaction },
        );
      });
    }

    if (inscription.statut === "Confirmée") {
      await this.waitlistService.cancelOverlappingOthers(
        num_adherent,
        sortie,
        inscription.id_inscription,
      );
    }

    if (adherentRecord?.email) {
      sendInscriptionConfirmationEmail({
        to: adherentRecord.email,
        adherentName: `${adherentRecord.prenom} ${adherentRecord.nom}`,
        sortieLabel: formatSortieLabel(sortie),
      }).catch((error) =>
        console.error("Erreur envoi email confirmation inscription:", error.message),
      );
    }

    return inscription;
  }

  async confirmInscription(id, user = null) {
    const inscription = await this.getById(id);
    if (!inscription) throw new Error("Inscription non trouvée");

    if (this.canManageInscriptions(user?.role)) {
      await this.assertCanManageInscription(inscription, user);
    } else {
      // Seule exception à "un adhérent ne peut jamais s'auto-confirmer"
      // (voir createInscription) : reconfirmer une place qu'il avait déjà
      // avant une replanification météo (Sortie.reconfirmation_requise posé
      // par SortieService.replanifier) — jamais une confirmation initiale,
      // qui reste réservée à un gestionnaire.
      if (!inscription.reconfirmation_requise) {
        throw new Error("Seul un gestionnaire peut confirmer une inscription");
      }
      await this.assertCanAccessInscription(inscription, user);
    }

    if (inscription.statut === "Confirmée") {
      return inscription;
    }

    // Une sortie annulée (manuellement ou par le cron météo) ne doit plus
    // jamais pouvoir accueillir de nouvelle confirmation — même règle que
    // createInscription (RG "impossible de s'inscrire à une sortie
    // annulée"), appliquée ici côté confirmation d'une inscription
    // existante (ex. une demande restée "En attente" au moment de
    // l'annulation).
    if (inscription.sortie?.statut === "Annulée") {
      throw new Error("Cette sortie est annulée : impossible de confirmer une inscription");
    }

    // Capacité lue et écriture faites sous le même verrou sur la sortie —
    // voir le raisonnement dans createInscription.
    await sequelize.transaction(async (transaction) => {
      const { placesDisponibles } = await this.waitlistService.getSortieCapacityLocked(
        inscription.id_sortie,
        id,
        transaction,
      );

      if (placesDisponibles <= 0) {
        throw new Error("Plus de places disponibles");
      }
      await this.assertNoConfirmedOverlap(inscription.num_adherent, inscription.sortie, id);

      inscription.statut = "Confirmée";
      inscription.rang_liste_attente = null;
      inscription.date_confirmation = new Date();
      inscription.reconfirmation_requise = false;
      await inscription.save({ transaction });
    });
    await this.waitlistService.normalizeWaitlistRanks(inscription.id_sortie);
    await this.waitlistService.cancelOverlappingOthers(
      inscription.num_adherent,
      inscription.sortie,
      id,
    );

    return inscription;
  }

  async cancelInscription(id, user = null, authHeader = null) {
    const inscription = await this.getById(id);
    if (!inscription) throw new Error("Inscription non trouvée");
    if (this.canManageInscriptions(user?.role)) {
      await this.assertCanManageInscription(inscription, user);
    } else {
      await this.assertCanAccessInscription(inscription, user);
    }

    const oldStatus = inscription.statut;

    inscription.statut = "Annulée";
    inscription.rang_liste_attente = null;
    inscription.reconfirmation_requise = false;
    await inscription.save();

    if (oldStatus === "Confirmée") {
      await this.waitlistService.promoteNextFromWaitlist(inscription.id_sortie, authHeader);
    } else if (oldStatus === "Liste d'attente") {
      await this.waitlistService.normalizeWaitlistRanks(inscription.id_sortie);
    }

    return inscription;
  }

  // Enregistre un paiement (acompte ou solde) pour le tarif de la sortie —
  // même logique que AdhesionService.enregistrerPaiementComplementaire.
  // Paiement vit dans finance-service (autre process) : la mise à jour du
  // solde local et la création de la ligne Paiement ne sont plus dans la
  // même transaction DB — compromis assumé (voir FormationService.enregistrerPaiement).
  async enregistrerPaiement(id_inscription, { montant, mode, description }, user = null, authHeader = null) {
    if (!montant || montant <= 0) throw new Error("Le montant doit être supérieur à 0");

    const inscription = await this.inscriptionRepository.findById(id_inscription);
    if (!inscription) throw new Error("Inscription non trouvée");

    const id_tresorier = await identiteClient.getTresorierIdForUser(user);
    const { isDuplicate } = await paiementClient.createLinkedPayment({
      num_adherent: inscription.num_adherent,
      montant,
      mode: mode || "Espèces",
      type_paiement: "Sortie",
      reference_id: id_inscription,
      id_tresorier,
      description: description || `Paiement sortie N°${inscription.id_sortie}`,
    }, authHeader);

    if (isDuplicate) return inscription;

    const montantDu = Number(inscription.montant_du) || 0;
    const nouveauMontantPaye = Number(inscription.montant_paye || 0) + Number(montant);
    const paye = montantDu > 0 ? nouveauMontantPaye >= montantDu : true;

    const updated = await this.inscriptionRepository.update(id_inscription, {
      montant_paye: nouveauMontantPaye,
      paye,
    });

    try {
      const adherent = await identiteClient.getAdherentById(inscription.num_adherent, authHeader);
      const sortie = await this.sortieService.getSortieDetails(inscription.id_sortie, authHeader);
      if (adherent?.email) {
        await sendInscriptionPaymentEmail({
          to: adherent.email,
          adherentName: `${adherent.prenom} ${adherent.nom}`,
          sortieLabel: formatSortieLabel(sortie),
          montantRecu: montant,
          montantPaye: nouveauMontantPaye,
          montantDu,
          paye,
        });
      }
    } catch (error) {
      console.error("Erreur envoi email confirmation paiement sortie:", error.message);
    }

    return updated;
  }

  async validateInscriptionData(data) {
    const errors = [];

    if (!data.num_adherent) {
      errors.push({ field: "num_adherent", message: "L'adhérent est requis" });
    }
    if (!data.id_sortie) {
      errors.push({ field: "id_sortie", message: "La sortie est requise" });
    }

    return errors;
  }
}

module.exports = InscriptionService;
