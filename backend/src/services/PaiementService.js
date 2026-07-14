const BaseService = require('./BaseService');
const PaiementRepository = require('../repositories/PaiementRepository');
const { getAdherentForUser } = require('../utils/roleScope');

class PaiementService extends BaseService {
  constructor() {
    const repository = new PaiementRepository();
    super(repository);
    this.paiementRepository = repository;
  }

  // Enregistrer un paiement "Adhesion" depuis le registre général doit avoir
  // le même effet que le formulaire dédié : le montant_paye/statut_paiement
  // de l'adhésion visée doit se mettre à jour, quel que soit le chemin
  // emprunté pour saisir le paiement. On délègue donc à AdhesionService (qui
  // crée déjà la ligne Paiement liée) plutôt que d'insérer une ligne isolée.
  async create(data, user = null) {
    // Require ici (et non en tête de fichier) pour éviter une dépendance
    // circulaire : Adhesion/Inscription/FormationService instancient déjà
    // PaiementService. Chaque type "avec référence" délègue à son service
    // métier pour que le montant_paye/statut de l'objet visé reste
    // synchronisé, quel que soit le formulaire utilisé pour saisir le
    // paiement (registre général ou action dédiée).
    if (data.type_paiement === 'Adhesion' && data.reference_id) {
      const AdhesionService = require('./AdhesionService');
      const adhesionService = new AdhesionService();
      await adhesionService.enregistrerPaiementComplementaire(
        data.reference_id,
        { montant: Number(data.montant), mode: data.mode, description: data.description },
        user,
      );
      return await this.paiementRepository.findLatestByReference('Adhesion', data.reference_id);
    }

    if (data.type_paiement === 'Sortie' && data.reference_id) {
      const InscriptionService = require('./InscriptionService');
      const inscriptionService = new InscriptionService();
      await inscriptionService.enregistrerPaiement(
        parseInt(data.reference_id),
        { montant: Number(data.montant), mode: data.mode, description: data.description },
        user,
      );
      return await this.paiementRepository.findLatestByReference('Sortie', data.reference_id);
    }

    if (data.type_paiement === 'Formation' && data.reference_id) {
      const FormationService = require('./FormationService');
      const formationService = new FormationService();
      await formationService.enregistrerPaiement(
        data.reference_id,
        { montant: Number(data.montant), mode: data.mode, description: data.description },
        user,
      );
      return await this.paiementRepository.findLatestByReference('Formation', data.reference_id);
    }

    return await this.paiementRepository.create(data);
  }

  async getAll(user = null) {
    const adherent = await getAdherentForUser(user);
    if (adherent) {
      return await this.paiementRepository.findByAdherent(adherent.num_adherent);
    }
    return await this.paiementRepository.findAll();
  }

  async getById(id, user = null) {
    const paiement = await this.paiementRepository.findById(id);
    if (paiement) {
      const adherent = await getAdherentForUser(user);
      if (adherent && paiement.num_adherent !== adherent.num_adherent) {
        throw new Error("Accès refusé à ce paiement");
      }
    }
    return paiement;
  }

  async getPendingPayments() {
    return await this.paiementRepository.findPendingPayments();
  }

  async getPaymentsByAdherent(num_adherent, user = null) {
    const adherent = await getAdherentForUser(user);
    if (adherent && num_adherent !== adherent.num_adherent) {
      throw new Error("Accès refusé à ces paiements");
    }
    return await this.paiementRepository.findByAdherent(num_adherent);
  }

  // ✅ Ajout de getPaymentStats
  async getPaymentStats() {
    return await this.paiementRepository.getStats();
  }

  async getTotalPaymentsByPeriod(startDate, endDate) {
    return await this.paiementRepository.getTotalPaymentsByPeriod(startDate, endDate);
  }

  async validatePaymentData(data) {
    const errors = [];

    if (!data.num_adherent) errors.push('L\'adhérent est requis');
    if (!data.montant || data.montant <= 0) {
      errors.push('Le montant doit être supérieur à 0');
    }
    if (!data.mode) errors.push('Le mode de paiement est requis');
    if (!data.type_paiement) errors.push('Le type de paiement est requis');
    if (data.type_paiement === 'Adhesion' && !data.reference_id) {
      errors.push('L\'adhésion concernée est requise');
    }
    if (data.type_paiement === 'Sortie' && !data.reference_id) {
      errors.push('L\'inscription concernée est requise');
    }
    if (data.type_paiement === 'Formation' && !data.reference_id) {
      errors.push('La formation concernée est requise');
    }

    return errors;
  }

  // À appeler par Adhesion/Formation/Inscription AVANT de modifier le solde
  // (montant_paye) de l'objet métier : une requête dupliquée (double-clic,
  // retry réseau) doit être ignorée avant toute mise à jour, sinon le solde
  // serait incrémenté deux fois même si la ligne Paiement, elle, n'est créée
  // qu'une fois par createLinkedPayment.
  async hasRecentDuplicate({ num_adherent, type_paiement, reference_id, montant }) {
    const duplicate = await this.paiementRepository.findRecentDuplicate({
      num_adherent,
      type_paiement,
      reference_id,
      montant,
    });
    return !!duplicate;
  }

  // Utilisé par Adhesion/Formation/Inscription/Attribution pour créer,
  // automatiquement et de façon cohérente, la ligne "Paiements" liée à
  // l'objet métier concerné (type_paiement + reference_id = id de cet objet).
  async createLinkedPayment({
    num_adherent,
    montant,
    mode,
    type_paiement,
    reference_id,
    id_tresorier = null,
    description = null,
    statut = "Payé",
  }) {
    // Un double-clic ou une double soumission peut envoyer deux requêtes
    // quasi simultanées avant qu'un garde-fou front-end n'ait pu bloquer la
    // seconde : si un paiement identique vient d'être créé (même adhérent,
    // type, référence, montant) il y a moins de 10s, on renvoie celui-ci au
    // lieu d'en insérer un second.
    const duplicate = await this.paiementRepository.findRecentDuplicate({
      num_adherent,
      type_paiement,
      reference_id,
      montant,
    });
    if (duplicate) return duplicate;

    return await this.paiementRepository.create({
      num_adherent,
      montant,
      mode,
      type_paiement,
      reference_id: reference_id !== undefined && reference_id !== null ? String(reference_id) : null,
      id_tresorier,
      description,
      statut,
    });
  }

  async processPayment(id) {
    const payment = await this.getById(id);
    if (!payment) throw new Error('Paiement non trouvé');
    
    if (payment.statut === 'Payé') {
      throw new Error('Ce paiement a déjà été validé');
    }

    payment.statut = 'Payé';
    await payment.save();
    
    return payment;
  }

  async cancelPayment(id) {
    const payment = await this.getById(id);
    if (!payment) throw new Error('Paiement non trouvé');
    
    if (payment.statut === 'Remboursé') {
      throw new Error('Ce paiement a déjà été remboursé');
    }
    
    payment.statut = 'Annulé';
    await payment.save();
    
    return payment;
  }
}

module.exports = PaiementService;