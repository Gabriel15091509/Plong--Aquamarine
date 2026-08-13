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

  async getAll(user = null, authHeader = null) {
    try {
      const adherent = await this.getAdherentForUser(user);
      const results = adherent
        ? await this.inscriptionRepository.findByAdherent(adherent.num_adherent)
        : await this.inscriptionRepository.findAll();
      return await withAdherent(results, { authHeader });
    } catch (error) {
      console.error("Erreur lors de la récupération des inscriptions :", error);
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

    const sortie = await this.sortieService.getSortieDetails(id_sortie, data.authHeader);
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

    // Le tarif adhérent de la sortie est figé au moment de l'inscription :
    // un changement de tarif ultérieur sur la sortie ne doit pas modifier
    // rétroactivement ce qui est dû par les inscrits déjà enregistrés.
    const montantDu = Number(sortie.tarif_adherent) || 0;
    const baseInscriptionData = {
      num_adherent,
      id_sortie,
      presence: data.presence || false,
      montant_du: montantDu,
      montant_paye: 0,
      paye: montantDu <= 0,
    };

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

        let statut = data.statut || "Confirmée";
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
      await inscription.save({ transaction });
    });
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
