const BaseService = require('./BaseService');
const AdhesionRepository = require('../repositories/AdhesionRepository');
const { computeStatutPaiement } = require('../utils/roleScope');
const identiteClient = require('../utils/serviceClients/identiteClient');
const paiementClient = require('../utils/serviceClients/paiementClient');
const { sendAdhesionPaymentEmail } = require('../utils/email');
const { analyserPhotoAdhesion } = require('../utils/adhesionPhotoAnalysis');
const { readAdhesionDocument } = require('../middlewares/upload');
const { judgeDocumentCoherence } = require('../utils/groqClient');

// Les 3 éléments obligatoires de l'adhésion (l'Assurance RC est incluse
// dans la Licence FFESM mais tracée comme une ligne distincte, comme dans
// le seed réel). L'Assurance IA est facultative et n'entre pas dans le calcul.
const TYPES_OBLIGATOIRES = ["Club", "FFESM", "Assurance RC"];

class AdhesionService extends BaseService {
  constructor() {
    const repository = new AdhesionRepository();
    super(repository);
    this.adhesionRepository = repository;
  }

  // Crée l'adhésion. Seule l'adhésion "Club" correspond à un vrai paiement
  // dans ce club (la licence FFESM et les assurances sont couvertes par la
  // cotisation Club, pas facturées séparément dans l'app) : pour ces autres
  // types, on se contente d'enregistrer la validité, sans montant ni ligne
  // Paiement, avec un statut "Payé" d'office (aucun encaissement à suivre —
  // voir le commentaire sur statut_paiement plus bas pour pourquoi cette
  // valeur reste "Payé" en base malgré tout).
  //
  // Un adhérent (pas le staff) peut soumettre lui-même une licence FFESM ou
  // une assurance — jamais l'adhésion Club — mais l'entrée reste "En
  // attente" (invisible pour checkDossierValidity) tant qu'un président/
  // trésorier ne l'a pas validée via validerAdhesion. `num_adherent` est
  // toujours recalculé depuis le token, jamais pris tel quel dans le corps
  // de la requête, pour qu'un adhérent ne puisse pas soumettre au nom d'un
  // autre.
  async create(data, user = null, authHeader = null) {
    const adherent = await identiteClient.getAdherentForUser(user);
    const estSoumissionAdherent = !!adherent;

    if (estSoumissionAdherent) {
      if (data.type === "Club") {
        throw new Error("L'adhésion Club ne peut pas être soumise par l'adhérent lui-même.");
      }
      data = { ...data, num_adherent: adherent.num_adherent };
    }

    await this.assertNoOverlap(data.num_adherent, data.type, data.date_debut, data.date_fin);
    await this.assertLicenceUniquePerPersonne(data.num_adherent, data.num_licence_ffesm);

    if (data.type !== "Club") {
      // Plus de validation manuelle du président pour une soumission
      // adhérent : Groq tranche seul (Validé/Rejeté) quand il répond, voir
      // judgeSubmittedDocument. Une entrée créée par le staff reste
      // "Validé" d'office comme avant, aucune analyse n'est nécessaire.
      let statut_validation = "Validé";
      let valide_par = user?.id ?? null;
      let valide_le = new Date();
      let motif_rejet = null;

      if (estSoumissionAdherent) {
        const decision = await this.judgeSubmittedDocument({
          typeDocument: data.type,
          document_path: data.document_path,
          adherent,
          champs: {
            num_licence_ffesm: data.num_licence_ffesm,
            date_debut: data.date_debut,
            date_fin: data.date_fin,
          },
        });
        statut_validation = decision.decision;
        valide_par = null;
        // "En attente" (Groq indisponible, voir groqClient.judgeDocumentCoherence)
        // n'est pas une décision prise : pas de date de validation tant que
        // le président/trésorier n'a pas réellement tranché.
        valide_le = decision.decision === "En attente" ? null : new Date();
        motif_rejet = decision.decision === "Rejeté" ? decision.motif : null;
      }

      return await this.adhesionRepository.create({
        ...data,
        montant: 0,
        montant_paye: 0,
        // Reste "Payé" en base (valeur technique) : findActiveAdhesions/
        // findExpiringAdhesions (AdhesionRepository), l'alerte d'expiration
        // (AlerteService) et surtout checkDossierValidity exigent tous
        // statut_paiement === "Payé" pour compter FFESM/Assurance comme
        // couverts — le changer casserait silencieusement la validité du
        // dossier adhérent. "Payé" est trompeur affiché tel quel dans
        // l'UI, donc c'est là qu'il est masqué (AdhesionList.jsx/
        // AdhesionDetails.jsx : badge affiché seulement pour type Club),
        // pas ici.
        statut_paiement: "Payé",
        soumis_par_adherent: estSoumissionAdherent,
        statut_validation,
        valide_par,
        valide_le,
        motif_rejet,
      });
    }

    const montant = Number(data.montant) || 0;
    const montantPaye =
      data.montant_paye !== undefined && data.montant_paye !== null && data.montant_paye !== ""
        ? Number(data.montant_paye)
        : montant;
    const statut_paiement = computeStatutPaiement(montant, montantPaye);

    const adhesion = await this.adhesionRepository.create({
      ...data,
      montant_paye: montantPaye,
      statut_paiement,
      statut_validation: "Validé",
      valide_par: user?.id ?? null,
      valide_le: new Date(),
    });

    if (montantPaye > 0) {
      const id_tresorier = await identiteClient.getTresorierIdForUser(user);
      await paiementClient.createLinkedPayment({
        num_adherent: data.num_adherent,
        montant: montantPaye,
        mode: data.mode || "Espèces",
        type_paiement: "Adhesion",
        reference_id: adhesion.id_adhesion,
        id_tresorier,
        description: `Adhésion ${data.type} ${data.annee_adhesion}`,
      }, authHeader);
      await this.notifyPayment(adhesion, authHeader);
    }

    return adhesion;
  }

  // Décision automatique (plus de validation manuelle systématique pour ce
  // circuit) : relit le document tout juste enregistré sur disque, réutilise
  // les mêmes heuristiques OCR que l'aperçu pré-soumission
  // (analyserPhotoAdhesion, déjà utilisée par analyserPhoto ci-dessous),
  // puis soumet le texte détecté + les champs saisis à Groq pour un jugement
  // final (voir groqClient.judgeDocumentCoherence : une indisponibilité de
  // Groq lui-même bascule sur "En attente", pas un rejet — seule une vraie
  // incohérence détectée aboutit à un rejet). Un document absent ou
  // illisible côté adhérent (pas un problème Groq) reste en revanche rejeté
  // immédiatement ci-dessous : resoumettre est la seule action utile.
  async judgeSubmittedDocument({ typeDocument, document_path, adherent, champs }) {
    if (!document_path) {
      return {
        decision: "Rejeté",
        motif: "Aucun document fourni avec cette soumission.",
      };
    }

    // Fichier illisible/corrompu : pas un problème Groq (jamais atteint),
    // donc pas de repli "En attente" ici non plus — resoumettre une photo
    // lisible est la seule action utile.
    try {
      const buffer = readAdhesionDocument(document_path);
      const champsAttendus = {
        nom: adherent.nom,
        prenom: adherent.prenom,
        num_licence_ffesm: champs.num_licence_ffesm,
        date_debut: champs.date_debut,
        date_fin: champs.date_fin,
      };

      const analyse = await analyserPhotoAdhesion(buffer, {
        nom: adherent.nom,
        prenom: adherent.prenom,
        type: typeDocument,
        num_licence_ffesm: champs.num_licence_ffesm,
        date_debut: champs.date_debut,
        date_fin: champs.date_fin,
      });

      return await judgeDocumentCoherence({
        typeDocument,
        champsAttendus,
        texteOcr: analyse.texteDetecte,
        avertissementsHeuristiques: analyse.avertissements,
      });
    } catch (error) {
      return {
        decision: "Rejeté",
        motif: "Le document envoyé n'a pas pu être analysé (fichier illisible ou corrompu).",
      };
    }
  }

  async notifyPayment(adhesion, authHeader) {
    try {
      const adherent = await identiteClient.getAdherentById(adhesion.num_adherent, authHeader);
      if (!adherent) return;
      const dossier = await this.checkDossierValidity(adhesion.num_adherent);
      await sendAdhesionPaymentEmail({
        to: adherent.email,
        adherentName: `${adherent.prenom} ${adherent.nom}`,
        type: adhesion.type,
        montantRecu: adhesion.montant_paye,
        montantPaye: adhesion.montant_paye,
        montant: adhesion.montant,
        statutPaiement: adhesion.statut_paiement,
        dossier,
      });
    } catch (error) {
      // Une erreur d'envoi d'email ne doit jamais faire échouer l'enregistrement du paiement.
      console.error("Erreur envoi email confirmation adhésion:", error.message);
    }
  }

  // Ajoute un versement complémentaire sur une adhésion déjà créée
  // (échelonnement) : recalcule montant_paye/statut_paiement, trace le
  // paiement, et notifie l'adhérent.
  //
  // Paiement vit dans finance-service (autre process) : la mise à jour du
  // solde local et la création de la ligne Paiement ne sont plus dans la
  // même transaction DB (même compromis assumé que
  // FormationService.enregistrerPaiement) — on encaisse d'abord la
  // confirmation de finance-service (source de vérité du doublon via
  // `/paiements/linked`), puis on met à jour notre propre solde seulement si
  // ce n'est pas un doublon.
  async enregistrerPaiementComplementaire(id_adhesion, { montant, mode, description }, user = null, authHeader = null) {
    if (!montant || montant <= 0) throw new Error("Le montant doit être supérieur à 0");

    const adhesion = await this.adhesionRepository.findById(id_adhesion);
    if (!adhesion) throw new Error("Adhésion non trouvée");
    if (adhesion.type !== "Club") {
      throw new Error("Seule l'adhésion Club a un paiement à enregistrer");
    }

    const id_tresorier = await identiteClient.getTresorierIdForUser(user);
    const { isDuplicate } = await paiementClient.createLinkedPayment({
      num_adherent: adhesion.num_adherent,
      montant,
      mode: mode || "Espèces",
      type_paiement: "Adhesion",
      reference_id: id_adhesion,
      id_tresorier,
      description: description || `Complément adhésion ${adhesion.type}`,
    }, authHeader);

    if (isDuplicate) return adhesion;

    const nouveauMontantPaye = Number(adhesion.montant_paye) + Number(montant);
    const statut_paiement = computeStatutPaiement(adhesion.montant, nouveauMontantPaye);
    const updated = await this.adhesionRepository.update(id_adhesion, {
      montant_paye: nouveauMontantPaye,
      statut_paiement,
    });

    await this.notifyPayment(updated, authHeader);

    return updated;
  }

  // Statut affichable dérivé de date_fin, calculé à chaque lecture plutôt
  // que stocké : contrairement à CertificatMedical.statut (saisi
  // manuellement par le moniteur/président, donc capable de rester
  // "Valide" en base après la date sans un cron pour le rattraper — voir
  // CertificatMedicalService.deriveStatut/expireOverdueCertificates),
  // l'adhésion n'a pas de statut de validité éditable : date_fin est déjà
  // l'unique source de vérité (comme dans checkDossierValidity ci-dessus),
  // donc pas de colonne à faire décaler ni de cron à prévoir ici — un
  // simple recalcul à la lecture suffit et ne peut jamais être périmé.
  deriveStatut(adhesion) {
    const data = adhesion.toJSON ? adhesion.toJSON() : adhesion;
    const expiree = data.date_fin && new Date(data.date_fin) < new Date();
    return { ...data, statut: expiree ? "Expiré" : "Valide" };
  }

  // Verrou réservé aux entrées passées par le circuit de soumission
  // adhérent (soumis_par_adherent) une fois validées — pas aux adhésions
  // créées directement par le staff (ex. Club), qui restent modifiables
  // comme avant. Sans ce distinguo, un trésorier ne pourrait plus jamais
  // corriger un paiement Club existant, ce que la demande ne visait pas.
  async update(id, data) {
    const adhesion = await this.adhesionRepository.findById(id);
    if (!adhesion) throw new Error("Adhésion non trouvée");
    if (adhesion.soumis_par_adherent && adhesion.statut_validation === "Validé") {
      throw new Error(
        "Adhésion validée : non modifiable. Créez une nouvelle entrée si besoin d'une correction.",
      );
    }
    await this.assertNoOverlap(
      adhesion.num_adherent,
      data.type ?? adhesion.type,
      data.date_debut ?? adhesion.date_debut,
      data.date_fin ?? adhesion.date_fin,
      id,
    );
    await this.assertLicenceUniquePerPersonne(
      adhesion.num_adherent,
      data.num_licence_ffesm ?? adhesion.num_licence_ffesm,
      id,
    );
    return await this.adhesionRepository.update(id, data);
  }

  // Le n° de licence FFESM est délivré une seule fois par la fédération à
  // une personne : deux adhérents ne peuvent légitimement pas en partager
  // un (même règle que Adherent.num_licence_ffesm, identite-service — mais
  // Adhesion vit dans un schéma/service séparé, sans contrainte unique
  // Postgres possible entre les deux, d'où cette vérification applicative).
  // Se limite volontairement aux autres lignes Adhesion (même service) :
  // un vrai conflit avec le num_licence_ffesm d'un AUTRE adhérent côté
  // identite-service nécessiterait un nouvel endpoint de recherche inversée
  // qui n'existe pas encore — resterait un doublon possible mais rare tant
  // qu'il n'a pas été introduit ici.
  async assertLicenceUniquePerPersonne(num_adherent, num_licence_ffesm, excludeId = null) {
    if (!num_licence_ffesm) return;
    const conflit = await this.adhesionRepository.findOtherAdherentWithLicence(
      num_licence_ffesm,
      num_adherent,
      excludeId,
    );
    if (conflit) {
      throw new Error(
        `Le numéro de licence FFESM "${num_licence_ffesm}" est déjà enregistré pour un autre adhérent (N°${conflit.num_adherent}).`,
      );
    }
  }

  // Empêche deux adhésions du même type, pour le même adhérent, dont les
  // périodes se chevauchent (ex. deux "Club" couvrant en partie la même
  // année) — source de doublons/double facturation, cf. discussion produit.
  // Un renouvellement anticipé (dates futures, ne chevauchant pas la
  // période en cours) reste autorisé ; seule une vraie intersection de
  // dates est bloquée. `excludeId` (mise à jour) ignore l'entrée elle-même.
  async assertNoOverlap(num_adherent, type, date_debut, date_fin, excludeId = null) {
    if (!num_adherent || !type || !date_debut || !date_fin) return;
    const existing = await this.adhesionRepository.findOverlapping(
      num_adherent,
      type,
      date_debut,
      date_fin,
      excludeId,
    );
    if (existing) {
      const debut = new Date(existing.date_debut).toLocaleDateString("fr-FR");
      const fin = new Date(existing.date_fin).toLocaleDateString("fr-FR");
      throw new Error(
        `Cet adhérent a déjà une adhésion "${type}" du ${debut} au ${fin} qui chevauche ces dates. Corrigez les dates ou modifiez l'entrée existante.`,
      );
    }
  }

  async delete(id) {
    const adhesion = await this.adhesionRepository.findById(id);
    if (!adhesion) throw new Error("Adhésion non trouvée");
    if (adhesion.soumis_par_adherent && adhesion.statut_validation === "Validé") {
      throw new Error("Adhésion validée : suppression impossible.");
    }
    return await this.adhesionRepository.delete(id);
  }

  // Réservé au président/trésorier (voir routes) : bascule une soumission
  // "En attente" vers "Validé" (utilisable dès lors par checkDossierValidity)
  // ou "Rejeté" (avec motif, l'adhérent peut resoumettre une nouvelle
  // entrée). Passe par le repository directement, pas par this.update, qui
  // bloque justement toute modification une fois "Validé" — cette méthode
  // est la seule voie légitime pour poser cette décision.
  async validerAdhesion(id, { decision, motif } = {}, user = null) {
    if (!["Validé", "Rejeté"].includes(decision)) {
      throw new Error('Décision invalide : "Validé" ou "Rejeté" attendu.');
    }
    const adhesion = await this.adhesionRepository.findById(id);
    if (!adhesion) throw new Error("Adhésion non trouvée");
    if (adhesion.statut_validation !== "En attente") {
      throw new Error("Cette soumission a déjà été traitée et ne peut plus être modifiée.");
    }
    if (decision === "Rejeté" && !motif) {
      throw new Error("Un motif de rejet est requis.");
    }

    return await this.adhesionRepository.update(id, {
      statut_validation: decision,
      valide_par: user?.id ?? null,
      valide_le: new Date(),
      motif_rejet: decision === "Rejeté" ? motif : null,
    });
  }

  async getAll(user = null) {
    const adherent = await identiteClient.getAdherentForUser(user);
    const adhesions = adherent
      ? await this.adhesionRepository.findByAdherent(adherent.num_adherent)
      : await this.adhesionRepository.findAll();
    return adhesions.map((a) => this.deriveStatut(a));
  }

  async getById(id, user = null) {
    const adhesion = await this.adhesionRepository.findById(id);
    if (adhesion) {
      const adherent = await identiteClient.getAdherentForUser(user);
      if (adherent && adhesion.num_adherent !== adherent.num_adherent) {
        throw new Error("Accès refusé à cette adhésion");
      }
      return this.deriveStatut(adhesion);
    }
    return adhesion;
  }

  async getActiveAdhesions() {
    const adhesions = await this.adhesionRepository.findActiveAdhesions();
    return adhesions.map((a) => this.deriveStatut(a));
  }

  async getExpiringAdhesions(days = 30) {
    const adhesions = await this.adhesionRepository.findExpiringAdhesions(days);
    return adhesions.map((a) => this.deriveStatut(a));
  }

  async getAdhesionsByAdherent(num_adherent, user = null) {
    const adherent = await identiteClient.getAdherentForUser(user);
    if (adherent && num_adherent !== adherent.num_adherent) {
      throw new Error("Accès refusé à ces adhésions");
    }
    const adhesions = await this.adhesionRepository.findByAdherent(num_adherent);
    return adhesions.map((a) => this.deriveStatut(a));
  }

  async getAdhesionStats() {
    return await this.adhesionRepository.getAdhesionStats();
  }

  // Vérifie que l'adhérent a bien, pour la date donnée, les éléments
  // obligatoires payés et couvrant cette date (par défaut : Club, FFESM,
  // Assurance RC). `requiredTypes` permet un dossier allégé pour un niveau
  // Baptême, qui n'est pas encore licencié FFESM ni assuré à l'année.
  async checkDossierValidity(num_adherent, atDate = new Date(), requiredTypes = TYPES_OBLIGATOIRES) {
    const adhesions = await this.adhesionRepository.findByAdherent(num_adherent);
    const missing = requiredTypes.filter((type) => {
      return !adhesions.some((a) => {
        return (
          a.type === type &&
          a.statut_paiement === "Payé" &&
          a.statut_validation === "Validé" &&
          new Date(a.date_debut) <= atDate &&
          new Date(a.date_fin) >= atDate
        );
      });
    });
    return { valid: missing.length === 0, missing };
  }

  async analyserPhoto(buffer, { num_adherent, type, num_licence_ffesm, date_debut, date_fin }, authHeader) {
    const adherent = await identiteClient.getAdherentById(num_adherent, authHeader);
    if (!adherent) {
      throw new Error("Adhérent non trouvé");
    }
    return await analyserPhotoAdhesion(buffer, {
      nom: adherent.nom,
      prenom: adherent.prenom,
      type,
      num_licence_ffesm,
      date_debut,
      date_fin,
    });
  }

  async validateAdhesionData(data) {
    const errors = [];

    if (!data.num_adherent) errors.push('L\'adhérent est requis');
    if (!data.type) errors.push('Le type d\'adhésion est requis');
    if (!data.date_debut) errors.push('La date de début est requise');
    if (!data.date_fin) errors.push('La date de fin est requise');
    if (data.type === 'Club' && (!data.montant || data.montant <= 0)) {
      errors.push('Le montant doit être supérieur à 0');
    }
    if (!data.annee_adhesion) errors.push('L\'année d\'adhésion est requise');

    if (data.date_debut && data.date_fin) {
      const debut = new Date(data.date_debut);
      const fin = new Date(data.date_fin);
      if (fin <= debut) {
        errors.push('La date de fin doit être postérieure à la date de début');
      }
    }

    return errors;
  }

  // Taux de renouvellement des adhésions (CDC 3.6.2) : parmi les adhérents
  // ayant une adhésion Club l'année précédente, quelle proportion en a repris
  // une cette année.
  async getTauxRenouvellement() {
    const anneeCourante = new Date().getFullYear();
    const anneePrecedente = anneeCourante - 1;

    const numsPrecedents = await this.adhesionRepository.findNumAdherentsClubByAnnee(anneePrecedente);
    if (numsPrecedents.length === 0) return 0;

    const numsCourants = await this.adhesionRepository.findNumAdherentsClubByAnnee(anneeCourante);
    const setCourants = new Set(numsCourants);
    const renouveles = numsPrecedents.filter((num) => setCourants.has(num)).length;

    return Math.round((renouveles / numsPrecedents.length) * 100);
  }
}

module.exports = AdhesionService;
