const BaseService = require("./BaseService");
const InscriptionRepository = require("../repositories/InscriptionRepository");
const SortieService = require("./SortieService");
const paiementClient = require("../utils/serviceClients/paiementClient");
const vieAssociativeClient = require("../utils/serviceClients/vieAssociativeClient");
const identiteClient = require("../utils/serviceClients/identiteClient");
const InscriptionWaitlistService = require("./InscriptionWaitlistService");
const { isNiveauCompatible } = require("../utils/roleScope");
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

  async getByAdherent(num_adherent) {
    return await this.inscriptionRepository.findByAdherent(num_adherent);
  }

  async getAll(user = null) {
    try {
      const adherent = await this.getAdherentForUser(user);
      if (adherent) {
        return await this.inscriptionRepository.findByAdherent(
          adherent.num_adherent,
        );
      }
      return await this.inscriptionRepository.findAll();
    } catch (error) {
      console.error("Erreur getAll:", error);
      return [];
    }
  }

  async getById(id, user = null) {
    try {
      const inscription = await this.inscriptionRepository.findById(id);
      if (inscription && user) {
        await this.assertCanAccessInscription(inscription, user);
      }
      return inscription;
    } catch (error) {
      console.error("Erreur getById:", error);
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
      console.error("Erreur delete:", error);
      throw error;
    }
  }

  async update(id, data) {
    const inscription = await this.inscriptionRepository.findById(id);
    if (!inscription) {
      throw new Error("Inscription non trouvée");
    }

    const canManage = this.canManageInscriptions(data.role);
    if (!canManage) {
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

    const updateData = {};
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }
    if (!canManage && nextStatus === "Annulée") {
      updateData.statut = "Annulée";
    }

    if (statusWillChange && nextStatus === "Confirmée") {
      const { placesDisponibles } = await this.waitlistService.getSortieCapacity(
        inscription.id_sortie,
        id,
        data.authHeader,
      );
      if (placesDisponibles <= 0) {
        throw new Error("Plus de places disponibles");
      }
      updateData.rang_liste_attente = null;
      updateData.date_confirmation = updateData.date_confirmation || new Date();
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

    const updated = await this.inscriptionRepository.update(id, updateData);

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

  async getConfirmationsBySortie(id_sortie, user = null, onlyPresent = false) {
    const results = await this.inscriptionRepository.findConfirmationsBySortie(
      id_sortie,
    );
    const filtered = onlyPresent
      ? results.filter((i) => i.presence && i.presence_checked)
      : results;
    const adherent = await this.getAdherentForUser(user);
    if (!adherent) return filtered;
    return filtered.filter(
      (inscription) => inscription.num_adherent === adherent.num_adherent,
    );
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
      console.error("Erreur getInscriptionStats:", error);
      return {
        total: 0,
        enAttente: 0,
        confirmees: 0,
        annulees: 0,
        listeAttente: 0,
      };
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

    const sortie = await this.sortieService.getSortieDetails(id_sortie, data.authHeader);
    if (!sortie) {
      throw new Error("Sortie non trouvée");
    }

    if (sortie.statut === "Annulée") {
      throw new Error("Cette sortie est annulée");
    }

    // ✅ On ne peut s'inscrire qu'à une sortie encore au stade "Planifiée" :
    // une fois "En cours"/"Terminée", les inscriptions n'ont plus de sens.
    if (sortie.statut !== "Planifiée") {
      throw new Error(
        "Les inscriptions ne sont possibles que pour une sortie planifiée",
      );
    }

    // ✅ Un adhérent ne peut pas s'inscrire si son adhésion n'est pas
    // valide (3 éléments obligatoires) ou si son certificat médical est
    // expiré/manquant — règle de sécurité, appliquée quel que soit
    // l'auteur de l'inscription (staff ou adhérent lui-même). Adhesion et
    // CertificatMedical vivent dans vie-associative-service : vérifiés par HTTP.
    const dossier = await vieAssociativeClient.checkDossierValidity(num_adherent, data.authHeader);
    if (!dossier.valid) {
      throw new Error(
        `Adhésion incomplète (manquant : ${dossier.missing.join(", ")})`,
      );
    }
    const certStatus = await vieAssociativeClient.checkCertificateStatus(num_adherent, data.authHeader);
    if (!certStatus.hasValidCertificate) {
      throw new Error("Le certificat médical est expiré ou manquant");
    }

    // ✅ Le niveau de l'adhérent doit être suffisant pour cette sortie.
    // Adherent vit dans identite-service : résolu par HTTP.
    const adherentRecord = await identiteClient.getAdherentById(num_adherent, data.authHeader);
    if (!isNiveauCompatible(adherentRecord?.niveau, sortie.niveau_requis)) {
      throw new Error("Niveau insuffisant pour cette sortie");
    }

    const { placesDisponibles } = await this.waitlistService.getSortieCapacity(id_sortie, null, data.authHeader);

    let statut = data.statut || "Confirmée";
    let rangListeAttente = null;

    if (!canManage) {
      statut = "En attente";
    } else if (placesDisponibles <= 0 && statut !== "En attente") {
      statut = "Liste d'attente";
      rangListeAttente = await this.waitlistService.getNextWaitlistRank(id_sortie);
    } else if (statut === "Confirmée") {
      rangListeAttente = null;
    } else if (statut === "Liste d'attente") {
      rangListeAttente = await this.waitlistService.getNextWaitlistRank(id_sortie);
    }

    // Le tarif adhérent de la sortie est figé au moment de l'inscription :
    // un changement de tarif ultérieur sur la sortie ne doit pas modifier
    // rétroactivement ce qui est dû par les inscrits déjà enregistrés.
    const montantDu = Number(sortie.tarif_adherent) || 0;
    const inscriptionData = {
      num_adherent,
      id_sortie,
      statut,
      rang_liste_attente: rangListeAttente,
      presence: data.presence || false,
      date_confirmation:
        data.date_confirmation || (statut === "Confirmée" ? new Date() : null),
      montant_du: montantDu,
      montant_paye: 0,
      paye: montantDu <= 0,
    };

    const inscription = await this.inscriptionRepository.create(inscriptionData);

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

  async confirmInscription(id, user = null, authHeader = null) {
    if (!this.canManageInscriptions(user?.role)) {
      throw new Error("Seul un gestionnaire peut confirmer une inscription");
    }
    const inscription = await this.getById(id);
    if (!inscription) throw new Error("Inscription non trouvée");

    if (inscription.statut === "Confirmée") {
      return inscription;
    }

    const { placesDisponibles } = await this.waitlistService.getSortieCapacity(
      inscription.id_sortie,
      id,
      authHeader,
    );

    if (placesDisponibles <= 0) {
      throw new Error("Plus de places disponibles");
    }

    inscription.statut = "Confirmée";
    inscription.rang_liste_attente = null;
    inscription.date_confirmation = new Date();
    await inscription.save();
    await this.waitlistService.normalizeWaitlistRanks(inscription.id_sortie);

    return inscription;
  }

  async cancelInscription(id, user = null, authHeader = null) {
    const inscription = await this.getById(id);
    if (!inscription) throw new Error("Inscription non trouvée");
    await this.assertCanAccessInscription(inscription, user);

    const oldStatus = inscription.statut;

    inscription.statut = "Annulée";
    inscription.rang_liste_attente = null;
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
