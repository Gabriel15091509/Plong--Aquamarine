const BaseService = require('./BaseService');
const PaiementRepository = require('../repositories/PaiementRepository');
const identiteClient = require('../utils/serviceClients/identiteClient');
const vieAssociativeClient = require('../utils/serviceClients/vieAssociativeClient');

class PaiementService extends BaseService {
  constructor() {
    const repository = new PaiementRepository();
    super(repository);
    this.paiementRepository = repository;
  }

  // Table de dispatch par `type_paiement` : enregistrer un paiement "Adhesion"
  // (ou Sortie/Formation) depuis le registre général doit avoir le même effet
  // que le formulaire dédié — le montant_paye/statut_paiement de l'objet visé
  // doit se mettre à jour, quel que soit le chemin emprunté pour saisir le
  // paiement. On délègue donc à chaque service propriétaire (qui crée déjà la
  // ligne Paiement liée en rappelant `/paiements/linked`) plutôt que
  // d'insérer une ligne isolée. Ajouter un nouveau type payable n'exige que
  // d'ajouter une entrée ici, pas de modifier `create`.
  //
  // Adhesion/Sortie vivent encore dans le monolithe (vie-associative-service/
  // activites-service pas encore découpés) : les handlers correspondants sont
  // des appels HTTP vers le monolithe. Formation vit dans formation-service :
  // appel HTTP direct. Aucun `require()` en-process ici — Paiement a quitté
  // le monolithe, ces services ne sont plus dans le même process de toute
  // façon.
  static get LINKED_PAYMENT_HANDLERS() {
    return {
      Adhesion: async (paiementService, data, user, authHeader) => {
        const adhesionClient = require('../utils/serviceClients/adhesionClient');
        await adhesionClient.enregistrerPaiement(
          data.reference_id,
          { montant: Number(data.montant), mode: data.mode, description: data.description },
          authHeader,
        );
        return await paiementService.paiementRepository.findLatestByReference('Adhesion', data.reference_id);
      },
      Sortie: async (paiementService, data, user, authHeader) => {
        const inscriptionClient = require('../utils/serviceClients/inscriptionClient');
        await inscriptionClient.enregistrerPaiement(
          parseInt(data.reference_id),
          { montant: Number(data.montant), mode: data.mode, description: data.description },
          authHeader,
        );
        return await paiementService.paiementRepository.findLatestByReference('Sortie', data.reference_id);
      },
      Formation: async (paiementService, data, user, authHeader) => {
        const formationClient = require('../utils/serviceClients/formationClient');
        await formationClient.enregistrerPaiement(
          data.reference_id,
          { montant: Number(data.montant), mode: data.mode, description: data.description },
          authHeader,
        );
        return await paiementService.paiementRepository.findLatestByReference('Formation', data.reference_id);
      },
    };
  }

  async create(data, user = null, authHeader = null) {
    const handler = data.reference_id
      ? PaiementService.LINKED_PAYMENT_HANDLERS[data.type_paiement]
      : null;
    if (handler) {
      return await handler(this, data, user, authHeader);
    }

    return await this.paiementRepository.create(data);
  }

  // Endpoint interne appelé par les services propriétaires d'un objet payant
  // (formation-service, materiel-service, et le monolithe pour Adhesion/
  // Sortie/Caution tant qu'ils ne sont pas eux-mêmes découpés) pour
  // enregistrer la ligne Paiement liée sans dupliquer la logique de
  // dé-duplication de `createLinkedPayment`. Renvoie aussi `isDuplicate` pour
  // que l'appelant sache s'il doit ou non mettre à jour son propre solde.
  async createLinkedPaymentFromRemote(data) {
    const duplicate = await this.paiementRepository.findRecentDuplicate({
      num_adherent: data.num_adherent,
      type_paiement: data.type_paiement,
      reference_id: data.reference_id,
      montant: data.montant,
    });
    if (duplicate) return { paiement: duplicate, isDuplicate: true };

    const paiement = await this.createLinkedPayment(data);
    return { paiement, isDuplicate: false };
  }

  async getAll(user = null) {
    const adherent = await identiteClient.getAdherentForUser(user);
    if (adherent) {
      return await this.paiementRepository.findByAdherent(adherent.num_adherent);
    }
    return await this.paiementRepository.findAll();
  }

  async getById(id, user = null) {
    const paiement = await this.paiementRepository.findById(id);
    if (paiement) {
      const adherent = await identiteClient.getAdherentForUser(user);
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
    const adherent = await identiteClient.getAdherentForUser(user);
    if (adherent && num_adherent !== adherent.num_adherent) {
      throw new Error("Accès refusé à ces paiements");
    }
    return await this.paiementRepository.findByAdherent(num_adherent);
  }

  async getPaymentStats() {
    return await this.paiementRepository.getStats();
  }

  async getTotalPaymentsByPeriod(startDate, endDate) {
    return await this.paiementRepository.getTotalPaymentsByPeriod(startDate, endDate);
  }

  // Même calcul que DashboardService.sumTrend(Paiement, "date_paiement",
  // "montant", { statut: "Payé" }) dans le monolithe — dupliqué ici (voir
  // FormationService.getTrend pour le motif d'origine), exposé via
  // `GET /paiements/trend` pour que le dashboard du monolithe le récupère par
  // HTTP au lieu d'une requête Sequelize directe sur un modèle qu'il n'a plus.
  async getTrend() {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastPeriod = new Date(startOfLastMonth);
    endOfLastPeriod.setDate(startOfLastMonth.getDate() + now.getDate());

    const [current, previous] = await Promise.all([
      this.paiementRepository.sumInPeriod("date_paiement", "montant", { statut: "Payé" }, startOfThisMonth, now),
      this.paiementRepository.sumInPeriod("date_paiement", "montant", { statut: "Payé" }, startOfLastMonth, endOfLastPeriod),
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

  // Relance automatique (CDC 3.1.4) : tout paiement encore "En attente" plus
  // de `days` jours après sa création génère (ou renouvelle) une alerte
  // "Paiement en retard" dans vie-associative-service. Appelé par un cron
  // (voir app.js) — best-effort, une alerte en échec n'interrompt pas les
  // autres.
  async relancerImpayes(days = 15) {
    const enRetard = await this.paiementRepository.findEnRetard(days);
    for (const paiement of enRetard) {
      try {
        await vieAssociativeClient.createAlerte(paiement.num_adherent, "Paiement en retard");
      } catch (error) {
        console.error(`Erreur alerte impayé (paiement ${paiement.id_paiement}):`, error.message);
      }
    }
    return enRetard.length;
  }

  // Libellé de la référence requise par type de paiement "lié" — même liste
  // de types que `LINKED_PAYMENT_HANDLERS` ; ajouter un type payable n'exige
  // que d'ajouter une entrée ici, pas de modifier `validatePaymentData`.
  static get REFERENCE_LABELS() {
    return {
      Adhesion: "L'adhésion concernée",
      Sortie: "L'inscription concernée",
      Formation: 'La formation concernée',
    };
  }

  async validatePaymentData(data) {
    const errors = [];

    if (!data.num_adherent) errors.push('L\'adhérent est requis');
    if (!data.montant || data.montant <= 0) {
      errors.push('Le montant doit être supérieur à 0');
    }
    if (!data.mode) errors.push('Le mode de paiement est requis');
    if (!data.type_paiement) errors.push('Le type de paiement est requis');

    const referenceLabel = PaiementService.REFERENCE_LABELS[data.type_paiement];
    if (referenceLabel && !data.reference_id) {
      errors.push(`${referenceLabel} est requise`);
    }

    return errors;
  }

  // À appeler par les services propriétaires AVANT de modifier le solde
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

  // Utilisé par les services propriétaires (Adhesion/Formation/Inscription/
  // Attribution, via `/paiements/linked`) pour créer, automatiquement et de
  // façon cohérente, la ligne "Paiements" liée à l'objet métier concerné
  // (type_paiement + reference_id = id de cet objet).
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

  // Utilisé par AttributionService (restitution de caution, dans le
  // monolithe) pour marquer "Remboursé" le paiement lié à une référence
  // donnée, sans que l'appelant ait besoin de connaître/accéder au
  // repository interne de ce service.
  async marquerRembourseParReference(type_paiement, reference_id) {
    const paiement = await this.paiementRepository.findOne({
      type_paiement,
      reference_id: String(reference_id),
    });
    if (paiement) {
      paiement.statut = "Remboursé";
      await paiement.save();
    }
    return paiement;
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
