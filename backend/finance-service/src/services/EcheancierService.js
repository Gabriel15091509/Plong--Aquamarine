const { sequelize } = require("../config/database");
const { Echeancier, Echeance } = require("../models");
const BaseService = require("./BaseService");
const EcheancierRepository = require("../repositories/EcheancierRepository");
const EcheanceRepository = require("../repositories/EcheanceRepository");
const PaiementService = require("./PaiementService");
const identiteClient = require("../utils/serviceClients/identiteClient");
const { ValidationError, NotFoundError } = require("../utils/errors");
const { sendEcheanceUpcomingEmail, sendEcheanceOverdueEmail } = require("../utils/email");

// Seuls ces types de paiement peuvent être échelonnés — Caution (dépôt de
// garantie matériel) n'a pas de sens à étaler dans le temps.
const TYPES_ELIGIBLES = ["Adhesion", "Sortie", "Formation"];

class EcheancierService extends BaseService {
  constructor() {
    const repository = new EcheancierRepository();
    super(repository);
    this.echeancierRepository = repository;
    this.echeanceRepository = new EcheanceRepository();
    this.paiementService = new PaiementService();
  }

  // Génère automatiquement `nb_echeances` échéances mensuelles à parts
  // égales à partir de `date_debut` — la dernière absorbe le reliquat
  // d'arrondi pour que la somme des échéances égale exactement montant_total.
  async create(data, user = null, _authHeader = null) {
    const { type_paiement, reference_id, num_adherent, montant_total, nb_echeances, date_debut } = data;

    if (!TYPES_ELIGIBLES.includes(type_paiement)) {
      throw new ValidationError(`Type de paiement non éligible à un échéancier : ${type_paiement}`);
    }
    if (!reference_id) throw new ValidationError("La référence de l'objet payé est requise");
    if (!num_adherent) throw new ValidationError("L'adhérent est requis");
    if (!montant_total || Number(montant_total) <= 0) {
      throw new ValidationError("Le montant total doit être supérieur à 0");
    }
    if (!nb_echeances || Number(nb_echeances) < 2) {
      throw new ValidationError("Un échéancier nécessite au moins 2 échéances");
    }
    if (!date_debut) throw new ValidationError("La date de la première échéance est requise");

    const total = Number(montant_total);
    const n = Number(nb_echeances);
    const base = Math.floor((total / n) * 100) / 100;
    const dateDebut = new Date(date_debut);
    const id_tresorier = await identiteClient.getTresorierIdForUser(user);

    return await sequelize.transaction(async (transaction) => {
      const echeancier = await Echeancier.create(
        {
          type_paiement,
          reference_id: String(reference_id),
          num_adherent,
          id_tresorier,
          montant_total: total,
          nb_echeances: n,
          date_debut: dateDebut,
          statut: "En cours",
        },
        { transaction },
      );

      let cumule = 0;
      const echeances = [];
      for (let numero = 1; numero <= n; numero++) {
        const montant = numero < n ? base : Math.round((total - cumule) * 100) / 100;
        cumule += montant;
        const dateEcheance = new Date(dateDebut);
        dateEcheance.setMonth(dateEcheance.getMonth() + (numero - 1));

        echeances.push(
          await Echeance.create(
            {
              id_echeancier: echeancier.id_echeancier,
              numero,
              date_echeance: dateEcheance,
              montant,
              statut: "En attente",
            },
            { transaction },
          ),
        );
      }

      echeancier.setDataValue("echeances", echeances);
      return echeancier;
    });
  }

  // Payer une échéance = passer par le pipeline de paiement existant
  // (PaiementService.create -> LINKED_PAYMENT_HANDLERS) : le service
  // propriétaire (Adhesion/Formation/Inscription) met à jour lui-même son
  // montant_paye/statut_paiement et envoie sa propre confirmation, exactement
  // comme pour un paiement ad-hoc. On se contente ensuite de marquer
  // l'échéance et, le cas échéant, l'échéancier entier comme soldés.
  async payerEcheance(id_echeance, { mode, description } = {}, user = null, authHeader = null) {
    const echeance = await this.echeanceRepository.findById(id_echeance);
    if (!echeance) throw new NotFoundError("Échéance non trouvée");
    if (echeance.statut === "Payée") throw new ValidationError("Cette échéance est déjà payée");
    if (echeance.statut === "Annulée") throw new ValidationError("Cette échéance est annulée");
    if (!mode) throw new ValidationError("Le mode de paiement est requis");

    const echeancier = echeance.echeancier;

    const paiement = await this.paiementService.create(
      {
        num_adherent: echeancier.num_adherent,
        montant: echeance.montant,
        mode,
        type_paiement: echeancier.type_paiement,
        reference_id: echeancier.reference_id,
        id_tresorier: echeancier.id_tresorier,
        description: description || `Échéance ${echeance.numero}/${echeancier.nb_echeances}`,
      },
      user,
      authHeader,
      // Cette échéance précise est déjà marquée payée juste après par ce
      // même appel : pas besoin (et surtout pas correct) de laisser
      // PaiementService relancer une réconciliation FIFO qui pourrait
      // marquer une autre échéance à sa place.
      { skipEcheancierSync: true },
    );

    echeance.statut = "Payée";
    echeance.id_paiement = paiement.id_paiement;
    await echeance.save();

    const soeurs = await Echeance.findAll({ where: { id_echeancier: echeancier.id_echeancier } });
    const solde = soeurs.every((e) => e.statut === "Payée" || e.statut === "Annulée");
    if (solde) {
      echeancier.statut = "Soldé";
      await echeancier.save();
    }

    return echeance;
  }

  async getByReference(type_paiement, reference_id) {
    return await this.echeancierRepository.findByReference(type_paiement, reference_id);
  }

  // Appelé par PaiementService.create() après tout paiement lié (Adhesion/
  // Sortie/Formation) qui n'est PAS passé par payerEcheance — typiquement un
  // règlement saisi directement depuis le registre général des paiements par
  // le trésorier/président. Sans ça, un échéancier actif sur la même
  // référence resterait figé sur des échéances "En attente" déjà réglées par
  // ce paiement direct, et cliquer ensuite sur "Marquer payée" ferait payer
  // une seconde fois le même montant. On impute donc le paiement sur les
  // échéances non soldées les plus anciennes (FIFO), à hauteur du montant
  // réglé — une échéance n'est marquée payée que si le crédit restant la
  // couvre en entier (pas de paiement partiel d'échéance représentable ici).
  async reconcilePaiement(type_paiement, reference_id, montant, id_paiement) {
    const echeanciers = await this.echeancierRepository.findByReference(type_paiement, String(reference_id));
    const echeancier = echeanciers.find((e) => e.statut === "En cours");
    if (!echeancier) return null;

    let credit = Number(montant);
    const echeancesDues = (echeancier.echeances || [])
      .filter((e) => e.statut === "En attente" || e.statut === "En retard")
      .sort((a, b) => a.numero - b.numero);

    for (const echeance of echeancesDues) {
      if (credit < Number(echeance.montant)) break;
      credit -= Number(echeance.montant);
      echeance.statut = "Payée";
      echeance.id_paiement = id_paiement;
      await echeance.save();
    }

    const toutes = await Echeance.findAll({ where: { id_echeancier: echeancier.id_echeancier } });
    if (toutes.every((e) => e.statut === "Payée" || e.statut === "Annulée")) {
      echeancier.statut = "Soldé";
      await echeancier.save();
    }

    return echeancier;
  }

  async getByAdherent(num_adherent) {
    return await this.echeancierRepository.findByAdherent(num_adherent);
  }

  // Point d'entrée du cron quotidien (voir app.js) : bascule d'abord les
  // échéances en retard, puis envoie les rappels — best-effort, l'échec d'un
  // envoi ne doit pas bloquer les autres destinataires.
  async envoyerRappelsEcheances(authHeader) {
    const flipped = await this.echeanceRepository.findAndFlipEnRetard();

    const aVenir = await this.echeanceRepository.findDueInDays(3);
    for (const echeance of aVenir) {
      try {
        const adherent = await identiteClient.getAdherentById(echeance.echeancier.num_adherent, authHeader);
        if (!adherent?.email) continue;
        await sendEcheanceUpcomingEmail({
          to: adherent.email,
          adherentName: `${adherent.prenom} ${adherent.nom}`,
          label: `${echeance.echeancier.type_paiement} #${echeance.echeancier.reference_id}`,
          montant: echeance.montant,
          date_echeance: echeance.date_echeance,
          id_echeance: echeance.id_echeance,
        });
      } catch (error) {
        console.error(`Erreur rappel échéance à venir (échéance ${echeance.id_echeance}):`, error.message);
      }
    }

    const enRetard = await this.echeanceRepository.findEnRetard();
    for (const echeance of enRetard) {
      try {
        const adherent = await identiteClient.getAdherentById(echeance.echeancier.num_adherent, authHeader);
        if (!adherent?.email) continue;
        await sendEcheanceOverdueEmail({
          to: adherent.email,
          adherentName: `${adherent.prenom} ${adherent.nom}`,
          label: `${echeance.echeancier.type_paiement} #${echeance.echeancier.reference_id}`,
          montant: echeance.montant,
          date_echeance: echeance.date_echeance,
          id_echeance: echeance.id_echeance,
        });
      } catch (error) {
        console.error(`Erreur rappel échéance en retard (échéance ${echeance.id_echeance}):`, error.message);
      }
    }

    return { flipped, aVenir: aVenir.length, enRetard: enRetard.length };
  }
}

module.exports = EcheancierService;
