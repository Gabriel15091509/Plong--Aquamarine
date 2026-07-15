const SortieService = require("./SortieService");
const identiteClient = require("../utils/serviceClients/identiteClient");
const { sendWaitlistPromotedEmail } = require("../utils/email");

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
    const { placesDisponibles } = await this.getSortieCapacity(id_sortie, null, authHeader);
    if (placesDisponibles <= 0) return null;

    const waitlist = await this.getWaitlistBySortie(id_sortie);
    const next = waitlist[0];
    if (!next) return null;

    next.statut = "Confirmée";
    next.rang_liste_attente = null;
    next.date_confirmation = new Date();
    await next.save();
    await this.normalizeWaitlistRanks(id_sortie);

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
