const BaseService = require('./BaseService');
const AdhesionRepository = require('../repositories/AdhesionRepository');
const { computeStatutPaiement } = require('../utils/roleScope');
const identiteClient = require('../utils/serviceClients/identiteClient');
const paiementClient = require('../utils/serviceClients/paiementClient');
const { sendAdhesionPaymentEmail } = require('../utils/email');

// ✅ Les 3 éléments obligatoires de l'adhésion (l'Assurance RC est incluse
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
  // Paiement, avec un statut "Payé" d'office (aucun encaissement à suivre).
  async create(data, user = null, authHeader = null) {
    if (data.type !== "Club") {
      return await this.adhesionRepository.create({
        ...data,
        montant: 0,
        montant_paye: 0,
        statut_paiement: "Payé",
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

  async getAll(user = null) {
    const adherent = await identiteClient.getAdherentForUser(user);
    if (adherent) {
      return await this.adhesionRepository.findByAdherent(adherent.num_adherent);
    }
    return await this.adhesionRepository.findAll();
  }

  async getById(id, user = null) {
    const adhesion = await this.adhesionRepository.findById(id);
    if (adhesion) {
      const adherent = await identiteClient.getAdherentForUser(user);
      if (adherent && adhesion.num_adherent !== adherent.num_adherent) {
        throw new Error("Accès refusé à cette adhésion");
      }
    }
    return adhesion;
  }

  async getActiveAdhesions() {
    return await this.adhesionRepository.findActiveAdhesions();
  }

  async getExpiringAdhesions(days = 30) {
    return await this.adhesionRepository.findExpiringAdhesions(days);
  }

  async getAdhesionsByAdherent(num_adherent, user = null) {
    const adherent = await identiteClient.getAdherentForUser(user);
    if (adherent && num_adherent !== adherent.num_adherent) {
      throw new Error("Accès refusé à ces adhésions");
    }
    return await this.adhesionRepository.findByAdherent(num_adherent);
  }

  async getAdhesionStats() {
    return await this.adhesionRepository.getAdhesionStats();
  }

  // ✅ Vérifie que l'adhérent a bien, pour la date donnée, les 3 éléments
  // obligatoires payés et couvrant cette date (Club, FFESM, Assurance RC).
  async checkDossierValidity(num_adherent, atDate = new Date()) {
    const adhesions = await this.adhesionRepository.findByAdherent(num_adherent);
    const missing = TYPES_OBLIGATOIRES.filter((type) => {
      return !adhesions.some((a) => {
        return (
          a.type === type &&
          a.statut_paiement === "Payé" &&
          new Date(a.date_debut) <= atDate &&
          new Date(a.date_fin) >= atDate
        );
      });
    });
    return { valid: missing.length === 0, missing };
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
}

module.exports = AdhesionService;
