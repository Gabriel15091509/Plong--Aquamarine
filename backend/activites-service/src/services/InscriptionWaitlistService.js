const { sequelize } = require("../models");
const SortieService = require("./SortieService");
const identiteClient = require("../utils/serviceClients/identiteClient");
const { sendWaitlistPromotedEmail } = require("../utils/email");
const { sortiesSeChevauchent } = require("../utils/sortieOverlap");

function formatSortieLabel(sortie) {
  const date = sortie?.date_heure
    ? new Date(sortie.date_heure).toLocaleDateString("fr-FR")
    : "";
  return `${sortie?.site || sortie?.lieu || "Sortie"} du ${date}`;
}

// Isole la logique de capacité/liste d'attente d'une sortie (comptage des
// places, rang, promotion automatique quand une place se libère).
// InscriptionService reste responsable du CRUD/de l'orchestration métier des
// inscriptions et délègue ici tout ce qui concerne la capacité/le rang.
class InscriptionWaitlistService {
  constructor(inscriptionRepository, sortieService = new SortieService()) {
    this.inscriptionRepository = inscriptionRepository;
    this.sortieService = sortieService;
  }

  async getSortieCapacity(id_sortie, excludeInscriptionId = null, authHeader = null) {
    const sortie = await this.sortieService.getSortieDetails(id_sortie, authHeader);
    if (!sortie) {
      throw new Error("Sortie non trouvée");
    }

    const inscriptions = (sortie.inscriptions || []).filter(
      (inscription) =>
        inscription.id_inscription !== parseInt(excludeInscriptionId),
    );
    const confirmedCount = inscriptions.filter(
      (inscription) => inscription.statut === "Confirmée",
    ).length;
    const waitlistCount = inscriptions.filter(
      (inscription) => inscription.statut === "Liste d'attente",
    ).length;

    return {
      sortie,
      confirmedCount,
      waitlistCount,
      placesDisponibles: Math.max(sortie.nb_places - confirmedCount, 0),
    };
  }

  // Variante transactionnelle de getSortieCapacity : pose un verrou
  // pessimiste sur la ligne de la sortie (SortieRepository.
  // lockForCapacityCheck) et compte les inscriptions Confirmée sous ce même
  // verrou, à appeler à l'intérieur de la transaction qui écrira ensuite le
  // nouveau statut "Confirmée" (createInscription/confirmInscription/
  // update). Sans ça, deux confirmations concurrentes pour la dernière
  // place libre lisent chacune "1 place disponible" avant que l'une des
  // deux écritures n'ait eu lieu, et les deux passent en "Confirmée" —
  // nb_inscrits dépasse alors nb_places, cassant l'invariant "1 confirmée =
  // 1 place occupée, le reste en liste d'attente" que ce service existe
  // pour garantir.
  async getSortieCapacityLocked(id_sortie, excludeInscriptionId, transaction) {
    const sortie = await this.sortieService.sortieRepository.lockForCapacityCheck(
      id_sortie,
      transaction,
    );
    if (!sortie) {
      throw new Error("Sortie non trouvée");
    }

    const confirmedCount = await this.inscriptionRepository.countConfirmedBySortie(
      id_sortie,
      excludeInscriptionId,
      transaction,
    );

    return {
      sortie,
      confirmedCount,
      placesDisponibles: Math.max(sortie.nb_places - confirmedCount, 0),
    };
  }

  async getWaitlistBySortie(id_sortie) {
    return await this.inscriptionRepository.getWaitlistBySortie(id_sortie);
  }

  async getNextWaitlistRank(id_sortie, excludeInscriptionId = null) {
    const waitlist = await this.getWaitlistBySortie(id_sortie);
    return (
      waitlist.filter(
        (inscription) =>
          inscription.id_inscription !== parseInt(excludeInscriptionId),
      ).length + 1
    );
  }

  // Une inscription venant d'être confirmée engage l'adhérent sur ce
  // créneau : ses AUTRES inscriptions encore non confirmées ("En attente" /
  // "Liste d'attente") à une sortie qui chevauche ce créneau n'ont plus de
  // sens (il ne peut pas être à deux endroits) et passent automatiquement en
  // "Annulée". Les inscriptions confirmées qui chevauchent sont déjà refusées
  // en amont (assertNoConfirmedOverlap). Best-effort : ne fait jamais
  // échouer la confirmation qui l'a déclenchée. Renvoie les inscriptions
  // annulées.
  async cancelOverlappingOthers(num_adherent, sortieConfirmee, excludeInscriptionId = null) {
    try {
      const autres = await this.inscriptionRepository.findByAdherent(num_adherent);
      const aAnnuler = autres.filter(
        (i) =>
          ["En attente", "Liste d'attente"].includes(i.statut) &&
          i.id_inscription !== excludeInscriptionId &&
          i.sortie &&
          i.sortie.id_sortie !== sortieConfirmee.id_sortie &&
          sortiesSeChevauchent(i.sortie, sortieConfirmee),
      );
      const sortiesAvecListeAttente = new Set();
      for (const inscription of aAnnuler) {
        if (inscription.statut === "Liste d'attente") {
          sortiesAvecListeAttente.add(inscription.id_sortie);
        }
        inscription.statut = "Annulée";
        inscription.rang_liste_attente = null;
        inscription.reconfirmation_requise = false;
        await inscription.save();
      }
      for (const id_sortie of sortiesAvecListeAttente) {
        await this.normalizeWaitlistRanks(id_sortie);
      }
      return aAnnuler;
    } catch (error) {
      console.error("Erreur annulation des inscriptions qui se chevauchent:", error.message);
      return [];
    }
  }

  async normalizeWaitlistRanks(id_sortie) {
    const waitlist = await this.getWaitlistBySortie(id_sortie);
    let rank = 1;
    for (const inscription of waitlist) {
      if (inscription.rang_liste_attente !== rank) {
        inscription.rang_liste_attente = rank;
        await inscription.save();
      }
      rank += 1;
    }
  }

  async promoteNextFromWaitlist(id_sortie, authHeader = null) {
    // Verrouillée comme les autres écritures qui touchent la capacité
    // (createInscription/confirmInscription/update dans InscriptionService)
    // : une annulation qui libère la dernière place et une confirmation
    // manuelle concurrente pour cette même place ne doivent pas pouvoir
    // toutes les deux réussir.
    let sortieConfirmee = null;
    const next = await sequelize.transaction(async (transaction) => {
      const { sortie, placesDisponibles } = await this.getSortieCapacityLocked(
        id_sortie,
        null,
        transaction,
      );
      if (placesDisponibles <= 0) return null;
      // Cet appel est un effet de bord d'une annulation/suppression
      // d'inscription (cancelInscription/update/delete dans
      // InscriptionService), pas une action directe de l'utilisateur — si la
      // sortie elle-même a été annulée entre-temps, on ne doit PAS confirmer
      // automatiquement le suivant de la liste d'attente. Retour silencieux
      // (pas d'erreur) pour ne pas faire échouer l'annulation qui a déclenché
      // cet appel.
      if (sortie.statut === "Annulée") return null;

      const waitlist = await this.inscriptionRepository.getWaitlistBySortie(
        id_sortie,
        transaction,
      );
      const candidate = waitlist[0];
      if (!candidate) return null;

      candidate.statut = "Confirmée";
      candidate.rang_liste_attente = null;
      candidate.date_confirmation = new Date();
      await candidate.save({ transaction });
      sortieConfirmee = sortie;
      return candidate;
    });

    if (!next) return null;
    await this.normalizeWaitlistRanks(id_sortie);
    await this.cancelOverlappingOthers(next.num_adherent, sortieConfirmee, next.id_inscription);

    try {
      const adherent = await identiteClient.getAdherentById(next.num_adherent, authHeader);
      const sortie = await this.sortieService.getSortieDetails(id_sortie, authHeader);
      if (adherent?.email) {
        await sendWaitlistPromotedEmail({
          to: adherent.email,
          adherentName: `${adherent.prenom} ${adherent.nom}`,
          sortieLabel: formatSortieLabel(sortie),
        });
      }
    } catch (error) {
      console.error("Erreur envoi email promotion liste d'attente:", error.message);
    }

    return next;
  }

  async getCapacityBySortie(id_sortie, authHeader = null) {
    const { sortie, confirmedCount, waitlistCount, placesDisponibles } =
      await this.getSortieCapacity(id_sortie, null, authHeader);
    const pendingCount = (sortie.inscriptions || []).filter(
      (inscription) => inscription.statut === "En attente",
    ).length;

    return {
      id_sortie: sortie.id_sortie,
      nb_places: sortie.nb_places,
      confirmees: confirmedCount,
      places_disponibles: placesDisponibles,
      en_attente: pendingCount,
      liste_attente: waitlistCount,
      complet: placesDisponibles <= 0,
    };
  }
}

module.exports = InscriptionWaitlistService;
