const BaseService = require('./BaseService');
const AttributionRepository = require('../repositories/AttributionRepository');
const materielClient = require('../utils/serviceClients/materielClient');
const paiementClient = require('../utils/serviceClients/paiementClient');
const identiteClient = require('../utils/serviceClients/identiteClient');
const vieAssociativeClient = require('../utils/serviceClients/vieAssociativeClient');
const { withAdherent } = require('../utils/enrichAdherents');

class AttributionService extends BaseService {
  constructor() {
    const repository = new AttributionRepository();
    super(repository);
    this.attributionRepository = repository;
  }

  // Un adhérent ne peut consulter que ses propres attributions ; le staff
  // (president/moniteur/tresorier, pas de rôle "adherent" résolu) voit
  // n'importe quel adhérent — même garde que PlongeeService.getPlongeesByAdherent.
  async getByAdherent(num_adherent, user = null) {
    const adherent = await identiteClient.getAdherentForUser(user);
    if (adherent && num_adherent !== adherent.num_adherent) {
      throw new Error("Accès refusé à ces attributions de matériel");
    }
    const attributions = await this.attributionRepository.findByAdherent(num_adherent);
    return await Promise.all(
      attributions.map(async (attribution) => {
        const plain = attribution.toJSON();
        plain.materiel = await materielClient.getByNumInventaire(plain.num_inventaire);
        return plain;
      }),
    );
  }

  async getByMateriel(num_inventaire) {
    return await this.attributionRepository.findByMateriel(num_inventaire);
  }

  async getBySortie(id_sortie) {
    return await this.attributionRepository.findBySortie(id_sortie);
  }

  // Materiel (materiel-service) et Adherent (identite-service) ont quitté ce
  // schéma : le repository ne peut plus faire d'`include` Sequelize dessus,
  // donc on récupère les attributions seules puis on recompose `.materiel`
  // et `.adherent` via des appels HTTP dédupliqués par valeur distincte.
  async getByPalanquee(id_palanquee, authHeader) {
    const attributions = await this.attributionRepository.findByPalanquee(id_palanquee);
    const withMateriel = await Promise.all(
      attributions.map(async (attribution) => {
        const plain = attribution.toJSON();
        plain.materiel = await materielClient.getByNumInventaire(plain.num_inventaire);
        return plain;
      }),
    );
    return await withAdherent(withMateriel, { authHeader });
  }

  async getEnCours() {
    return await this.attributionRepository.findEnCours();
  }

  async create(data, authHeader = null) {
    const disponible = await materielClient.checkAvailability(data.num_inventaire);
    if (!disponible) {
      throw new Error("Ce matériel n'est pas disponible (état ou échéance de révision)");
    }
    const dejaAttribue = await this.attributionRepository.findActiveByMateriel(data.num_inventaire);
    if (dejaAttribue) {
      throw new Error("Ce matériel est déjà attribué à un plongeur et n'a pas encore été rendu");
    }
    const attribution = await this.attributionRepository.create(data);

    // Best-effort : reflète le prêt sur la fiche matériel (localisation) —
    // une panne de materiel-service ne doit pas bloquer l'attribution.
    try {
      await materielClient.updateLocalisation(data.num_inventaire, "Prêté", authHeader);
    } catch (error) {
      console.error(`Erreur mise à jour localisation matériel ${data.num_inventaire}:`, error.message);
    }

    return attribution;
  }

  async retourner(id, { etat_retour, date_retour_reel }, authHeader = null) {
    const updated = await this.attributionRepository.update(id, { etat_retour, date_retour_reel });

    // Best-effort : le matériel rendu redevient disponible au club — sauf
    // s'il part directement en réparation (traiterDeterioration s'en charge
    // séparément, appelé après ce retour dans ce cas).
    try {
      await materielClient.updateLocalisation(updated.num_inventaire, "Local", authHeader);
    } catch (error) {
      console.error(`Erreur mise à jour localisation matériel ${updated.num_inventaire}:`, error.message);
    }

    return updated;
  }

  // Encaisse la caution demandée au prêt du matériel.
  async enregistrerCaution(id, { montant, mode }, user = null, authHeader = null) {
    const attribution = await this.attributionRepository.findById(id);
    if (!attribution) throw new Error("Attribution non trouvée");
    if (!montant || montant <= 0) throw new Error("Le montant doit être supérieur à 0");

    const updated = await this.attributionRepository.update(id, {
      montant_caution: montant,
      statut_caution: "Payée",
    });

    const id_tresorier = await identiteClient.getTresorierIdForUser(user);
    await paiementClient.createLinkedPayment({
      num_adherent: attribution.num_adherent,
      montant,
      mode: mode || "Espèces",
      type_paiement: "Caution",
      reference_id: id,
      id_tresorier,
      description: `Caution matériel ${attribution.num_inventaire}`,
    }, authHeader);

    return updated;
  }

  // Restitution complète de la caution — matériel rendu en bon état.
  async restituerCaution(id, authHeader = null) {
    const attribution = await this.attributionRepository.findById(id);
    if (!attribution) throw new Error("Attribution non trouvée");
    if (attribution.statut_caution !== "Payée") {
      throw new Error("Aucune caution payée à restituer pour ce prêt");
    }

    const updated = await this.attributionRepository.update(id, {
      statut_caution: "Remboursée",
    });

    await paiementClient.marquerRembourse("Caution", id, authHeader);

    return updated;
  }

  // Matériel rendu détérioré : la caution couvre tout ou partie du coût de
  // réparation, le reliquat éventuel est à restituer, le complément
  // éventuel est à réclamer.
  async traiterDeterioration(id, { description, prestataire, cout_reparation }, authHeader = null) {
    const attribution = await this.attributionRepository.findById(id);
    if (!attribution) throw new Error("Attribution non trouvée");
    if (!cout_reparation || cout_reparation < 0) {
      throw new Error("Le coût de réparation doit être positif");
    }

    const caution = Number(attribution.montant_caution) || 0;
    const cout = Number(cout_reparation);
    const montant_couvert_caution = Math.min(cout, caution);
    const montant_complement_du = Math.max(cout - caution, 0);

    const reparation = await materielClient.createReparation({
      num_inventaire: attribution.num_inventaire,
      date_constat: new Date(),
      description_panne: description || attribution.constat_deterioration,
      prestataire,
      cout,
      statut: "En cours",
      id_attribution: id,
      montant_couvert_caution,
      montant_complement_du,
    }, authHeader);

    let statut_caution = "Aucune";
    if (caution > 0) {
      statut_caution = cout >= caution ? "Conservée" : "Partiellement conservée";
    }
    const updatedAttribution = await this.attributionRepository.update(id, {
      statut_caution,
    });

    return { attribution: updatedAttribution, reparation };
  }

  // id_sortie n'est PAS requis : une attribution liée à une sortie (CDC
  // 3.4.3) le renseigne, un prêt libre entre deux sorties (CDC 3.4.4) le
  // laisse vide — les deux cas partagent la même structure.
  async validateAttributionData(data) {
    const errors = [];

    if (!data.num_inventaire) errors.push("Le matériel est requis");
    if (!data.num_adherent) errors.push("L'adhérent est requis");
    if (!data.date_attribution) errors.push("La date d'attribution est requise");
    if (!data.etat_depart) errors.push("L'état de départ est requis");
    if (!data.date_retour_prevue) errors.push("La date de retour prévue est requise");

    return errors;
  }

  // Alerte "prêt en retard" (CDC 3.4.4) : toute attribution non rendue dont
  // la date de retour prévue est dépassée génère (ou renouvelle) une alerte
  // dans vie-associative-service. Appelé par un cron (voir app.js) —
  // best-effort, une alerte en échec n'interrompt pas les autres.
  async alerterRetards() {
    const enRetard = await this.attributionRepository.findEnRetard();
    for (const attribution of enRetard) {
      try {
        await vieAssociativeClient.createAlerte(attribution.num_adherent, "Materiel en retard");
      } catch (error) {
        console.error(`Erreur alerte retard matériel (attribution ${attribution.id_attribution}):`, error.message);
      }
    }
    return enRetard.length;
  }
}

module.exports = AttributionService;
