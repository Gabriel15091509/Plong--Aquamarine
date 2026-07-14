const BaseService = require("./BaseService");
const InscriptionRepository = require("../repositories/InscriptionRepository");
const SortieService = require("./SortieService");
const AdhesionService = require("./AdhesionService");
const CertificatMedicalService = require("./CertificatMedicalService");
const PaiementService = require("./PaiementService");
const { Adherent, sequelize } = require("../models");
const { isNiveauCompatible, getTresorierIdForUser } = require("../utils/roleScope");
const {
  sendInscriptionConfirmationEmail,
  sendWaitlistPromotedEmail,
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
    this.adhesionService = new AdhesionService();
    this.certificatMedicalService = new CertificatMedicalService();
    this.paiementService = new PaiementService();
  }

  canManageInscriptions(role) {
    return ["president", "moniteur", "tresorier"].includes(role);
  }

  async getAdherentForUser(user) {
    if (!user || this.canManageInscriptions(user.role)) return null;
    const adherent = await Adherent.findOne({ where: { user_id: user.id } });
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

  // ✅ Récupérer les inscriptions d'un adhérent (toutes sorties confondues)
  async getByAdherent(num_adherent) {
    return await this.inscriptionRepository.findByAdherent(num_adherent);
  }

  // ✅ Récupérer toutes les inscriptions
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

  // ✅ Récupérer une inscription par ID
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

  // ✅ Supprimer une inscription
  async delete(id, user = null) {
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
        await this.promoteNextFromWaitlist(idSortie);
      } else if (oldStatus === "Liste d'attente") {
        await this.normalizeWaitlistRanks(idSortie);
      }

      return true;
    } catch (error) {
      console.error("Erreur delete:", error);
      throw error;
    }
  }

  // ✅ Mise à jour
  async update(id, data) {
    console.log("📝 Service update - ID:", id, "Data:", data);

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
      const { placesDisponibles } = await this.getSortieCapacity(
        inscription.id_sortie,
        id,
      );
      if (placesDisponibles <= 0) {
        throw new Error("Plus de places disponibles");
      }
      updateData.rang_liste_attente = null;
      updateData.date_confirmation = updateData.date_confirmation || new Date();
    }

    if (statusWillChange && nextStatus === "Liste d'attente") {
      updateData.rang_liste_attente = await this.getNextWaitlistRank(
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
      await this.promoteNextFromWaitlist(inscription.id_sortie);
    } else if (
      statusWillChange &&
      (oldStatus === "Liste d'attente" || nextStatus === "Liste d'attente")
    ) {
      await this.normalizeWaitlistRanks(inscription.id_sortie);
    }

    return updated;
  }

  // ✅ Capacité de la sortie
  async getSortieCapacity(id_sortie, excludeInscriptionId = null) {
    const sortie = await this.sortieService.getSortieDetails(id_sortie);
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

  // ✅ Prochain rang liste d'attente
  async getNextWaitlistRank(id_sortie, excludeInscriptionId = null) {
    const waitlist = await this.getWaitlistBySortie(id_sortie);
    return (
      waitlist.filter(
        (inscription) =>
          inscription.id_inscription !== parseInt(excludeInscriptionId),
      ).length + 1
    );
  }

  // ✅ Normaliser les rangs
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

  // ✅ Promouvoir le prochain de la liste d'attente
  async promoteNextFromWaitlist(id_sortie) {
    const { placesDisponibles } = await this.getSortieCapacity(id_sortie);
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
      const adherent = await Adherent.findByPk(next.num_adherent);
      const sortie = await this.sortieService.getSortieDetails(id_sortie);
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

  async getCapacityBySortie(id_sortie) {
    const { sortie, confirmedCount, waitlistCount, placesDisponibles } =
      await this.getSortieCapacity(id_sortie);
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

  // ✅ Récupérer les confirmations par sortie
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

  // ✅ Récupérer par adhérent et sortie
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

  // ✅ Récupérer la liste d'attente
  async getWaitlistBySortie(id_sortie, user = null) {
    const results = await this.inscriptionRepository.getWaitlistBySortie(
      id_sortie,
    );
    const adherent = await this.getAdherentForUser(user);
    if (!adherent) return results;
    return results.filter(
      (inscription) => inscription.num_adherent === adherent.num_adherent,
    );
  }

  // ✅ Statistiques des inscriptions
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

  // ✅ Créer une inscription
  async createInscription(data) {
    console.log("📝 createInscription - Data:", data);

    // ✅ Vérifier que les données sont valides
    if (!data.num_adherent) {
      throw new Error("L'adhérent est requis");
    }
    if (!data.id_sortie) {
      throw new Error("La sortie est requise");
    }

    // ✅ Convertir en nombres
    const num_adherent = data.num_adherent;
    const id_sortie = parseInt(data.id_sortie);
    const canManage = this.canManageInscriptions(data.role);
    if (!canManage) {
      const adherent = await this.getAdherentForUser(data.user);
      if (num_adherent !== adherent.num_adherent) {
        throw new Error("Un adhérent ne peut créer que sa propre inscription");
      }
    }

    // ✅ Vérifier si l'adhérent est déjà inscrit
    const existing = await this.getByAdherentAndSortie(num_adherent, id_sortie);
    if (existing) {
      throw new Error("Cet adhérent est déjà inscrit à cette sortie");
    }

    // ✅ Récupérer les détails de la sortie
    const sortie = await this.sortieService.getSortieDetails(id_sortie);
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
    // l'auteur de l'inscription (staff ou adhérent lui-même).
    const dossier = await this.adhesionService.checkDossierValidity(num_adherent);
    if (!dossier.valid) {
      throw new Error(
        `Adhésion incomplète (manquant : ${dossier.missing.join(", ")})`,
      );
    }
    const certStatus =
      await this.certificatMedicalService.checkCertificateStatus(num_adherent);
    if (!certStatus.hasValidCertificate) {
      throw new Error("Le certificat médical est expiré ou manquant");
    }

    // ✅ Le niveau de l'adhérent doit être suffisant pour cette sortie.
    const adherentRecord = await Adherent.findByPk(num_adherent);
    if (!isNiveauCompatible(adherentRecord?.niveau, sortie.niveau_requis)) {
      throw new Error("Niveau insuffisant pour cette sortie");
    }

    // ✅ Calculer les places disponibles
    const { placesDisponibles } = await this.getSortieCapacity(id_sortie);

    // ✅ Déterminer le statut
    let statut = data.statut || "Confirmée";
    let rangListeAttente = null;

    // ✅ Si l'utilisateur n'est pas gestionnaire, forcer "En attente"
    if (!canManage) {
      statut = "En attente";
    } else if (placesDisponibles <= 0 && statut !== "En attente") {
      statut = "Liste d'attente";
      rangListeAttente = await this.getNextWaitlistRank(id_sortie);
    } else if (statut === "Confirmée") {
      rangListeAttente = null;
    } else if (statut === "Liste d'attente") {
      rangListeAttente = await this.getNextWaitlistRank(id_sortie);
    }

    // ✅ Créer l'inscription
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

    console.log("📝 Création inscription:", inscriptionData);

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

  // ✅ Confirmer une inscription
  async confirmInscription(id, user = null) {
    if (!this.canManageInscriptions(user?.role)) {
      throw new Error("Seul un gestionnaire peut confirmer une inscription");
    }
    const inscription = await this.getById(id);
    if (!inscription) throw new Error("Inscription non trouvée");

    if (inscription.statut === "Confirmée") {
      return inscription;
    }

    const { placesDisponibles } = await this.getSortieCapacity(
      inscription.id_sortie,
      id,
    );

    if (placesDisponibles <= 0) {
      throw new Error("Plus de places disponibles");
    }

    inscription.statut = "Confirmée";
    inscription.rang_liste_attente = null;
    inscription.date_confirmation = new Date();
    await inscription.save();
    await this.normalizeWaitlistRanks(inscription.id_sortie);

    return inscription;
  }

  // ✅ Annuler une inscription
  async cancelInscription(id, user = null) {
    const inscription = await this.getById(id);
    if (!inscription) throw new Error("Inscription non trouvée");
    await this.assertCanAccessInscription(inscription, user);

    const oldStatus = inscription.statut;

    inscription.statut = "Annulée";
    inscription.rang_liste_attente = null;
    await inscription.save();

    if (oldStatus === "Confirmée") {
      await this.promoteNextFromWaitlist(inscription.id_sortie);
    } else if (oldStatus === "Liste d'attente") {
      await this.normalizeWaitlistRanks(inscription.id_sortie);
    }

    return inscription;
  }

  // Enregistre un paiement (acompte ou solde) pour le tarif de la sortie —
  // même logique que AdhesionService.enregistrerPaiementComplementaire :
  // cumule montant_paye, recalcule "paye", trace le paiement lié et notifie.
  async enregistrerPaiement(id_inscription, { montant, mode, description }, user = null) {
    if (!montant || montant <= 0) throw new Error("Le montant doit être supérieur à 0");

    // Deux requêtes quasi simultanées (double-clic, retry réseau) pour le
    // même paiement doivent être sérialisées : sans verrou, chacune lit le
    // même solde de départ, incrémente indépendamment et insère sa propre
    // ligne Paiement — d'où des doublons ET un solde final incohérent (perte
    // d'un des deux versements). Le verrou de ligne force la seconde requête
    // à attendre que la première ait committé avant de relire le solde à
    // jour et de détecter le paiement déjà enregistré (hasRecentDuplicate).
    const { updated, isDuplicate, montantDu, nouveauMontantPaye, paye, inscription } =
      await sequelize.transaction(async (t) => {
        const inscription = await this.inscriptionRepository.findById(id_inscription, {
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
        if (!inscription) throw new Error("Inscription non trouvée");

        const isDuplicate = await this.paiementService.hasRecentDuplicate({
          num_adherent: inscription.num_adherent,
          type_paiement: "Sortie",
          reference_id: id_inscription,
          montant,
        });
        if (isDuplicate) {
          return { updated: inscription, isDuplicate: true, inscription };
        }

        const montantDu = Number(inscription.montant_du) || 0;
        const nouveauMontantPaye = Number(inscription.montant_paye || 0) + Number(montant);
        const paye = montantDu > 0 ? nouveauMontantPaye >= montantDu : true;

        const updated = await this.inscriptionRepository.update(
          id_inscription,
          { montant_paye: nouveauMontantPaye, paye },
          { transaction: t },
        );

        const id_tresorier = await getTresorierIdForUser(user);
        await this.paiementService.createLinkedPayment({
          num_adherent: inscription.num_adherent,
          montant,
          mode: mode || "Espèces",
          type_paiement: "Sortie",
          reference_id: id_inscription,
          id_tresorier,
          description: description || `Paiement sortie N°${inscription.id_sortie}`,
        });

        return { updated, isDuplicate: false, montantDu, nouveauMontantPaye, paye, inscription };
      });

    if (isDuplicate) return updated;

    try {
      const adherent = await Adherent.findByPk(inscription.num_adherent);
      const sortie = await this.sortieService.getSortieDetails(inscription.id_sortie);
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

  // ✅ Valider les données
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
