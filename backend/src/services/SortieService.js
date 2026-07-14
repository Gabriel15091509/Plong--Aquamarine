const BaseService = require("./BaseService");
const SortieRepository = require("../repositories/SortieRepository");
const InscriptionRepository = require("../repositories/InscriptionRepository");
const { getAdherentForUser, isNiveauCompatible } = require("../utils/roleScope");

class SortieService extends BaseService {
  constructor() {
    const repository = new SortieRepository();
    super(repository);
    this.sortieRepository = repository;
    this.inscriptionRepository = new InscriptionRepository();
  }

  async filterByNiveauForUser(sorties, user) {
    const adherent = await getAdherentForUser(user);
    if (!adherent) return sorties;
    return sorties.filter((s) =>
      isNiveauCompatible(adherent.niveau, s.niveau_requis),
    );
  }

  // ✅ Places réellement disponibles = nb_places - inscriptions Confirmée.
  // On retire le détail des inscriptions de la réponse : seul le compte
  // importe ici, pas les coordonnées des inscrits.
  attachCapacity(sortieInstance) {
    const plain = sortieInstance.toJSON();
    const nb_inscrits = (plain.inscriptions || []).filter(
      (i) => i.statut === "Confirmée",
    ).length;
    delete plain.inscriptions;
    return {
      ...plain,
      nb_inscrits,
      places_disponibles: Math.max((plain.nb_places || 0) - nb_inscrits, 0),
    };
  }

  async getAll(user = null) {
    const sorties = await this.sortieRepository.findAllWithInscriptionCounts();
    const filtered = await this.filterByNiveauForUser(sorties, user);
    return filtered.map((s) => this.attachCapacity(s));
  }

  async getUpcomingSorties(user = null) {
    const sorties =
      await this.sortieRepository.findUpcomingWithInscriptionCounts();
    const filtered = await this.filterByNiveauForUser(sorties, user);
    return filtered.map((s) => this.attachCapacity(s));
  }

  async getSortiesWithInscriptions() {
    return await this.sortieRepository.findAllWithInscriptions();
  }

  async getAvailablePlaces() {
    const sorties = await this.sortieRepository.findAllWithInscriptions();
    return sorties.map((sortie) => ({
      ...sortie.toJSON(),
      placesDisponibles:
        sortie.nb_places -
        (sortie.inscriptions?.filter((i) => i.statut === "Confirmée").length ||
          0),
    }));
  }

  async getSortieStats() {
    const sorties = await this.sortieRepository.findAll();
    const now = new Date();
    return {
      total: sorties.length,
      aVenir: sorties.filter(
        (s) => new Date(s.date_heure) > now && s.statut !== "Annulée",
      ).length,
      passees: sorties.filter(
        (s) => new Date(s.date_heure) < now && s.statut !== "Annulée",
      ).length,
      annulees: sorties.filter((s) => s.statut === "Annulée").length,
    };
  }

  // ✅ Utiliser findByIdWithInscriptions pour les détails (sans User)
  async getSortieDetails(id) {
    return await this.sortieRepository.findByIdWithInscriptions(id);
  }

  // ✅ Pour le pointage, utiliser findByIdWithPointage (avec User)
  async getPointageBySortie(id_sortie) {
    const sortie = await this.sortieRepository.findByIdWithPointage(id_sortie);
    if (!sortie) throw new Error("Sortie non trouvée");
    if (sortie.inscriptions) {
      sortie.inscriptions.sort((a, b) => {
        const nomA = a.adherent?.nom || "";
        const nomB = b.adherent?.nom || "";
        return nomA.localeCompare(nomB);
      });
    }
    return sortie;
  }

  async getById(id) {
    const sortie = await this.sortieRepository.findByIdWithInscriptions(id);
    if (!sortie) return null;
    return this.attachCapacity(sortie);
  }

  async create(data) {
    return await this.sortieRepository.create(data);
  }

  async update(id, data) {
    const sortie = await this.sortieRepository.findById(id);
    if (!sortie) throw new Error("Sortie non trouvée");
    await sortie.update(data);
    return sortie;
  }

  async delete(id) {
    const sortie = await this.sortieRepository.findById(id);
    if (!sortie) throw new Error("Sortie non trouvée");
    await sortie.destroy();
    return true;
  }

  async enregistrerPointage(id_sortie, inscriptions, userId) {
    const sortie = await this.sortieRepository.findById(id_sortie);
    if (!sortie) throw new Error("Sortie non trouvée");

    const dateSortie = new Date(sortie.date_heure);
    const today = new Date();
    dateSortie.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    if (dateSortie > today)
      throw new Error("Impossible de pointer une sortie future");

    const results = [];
    for (const insc of inscriptions) {
      const inscription = await this.inscriptionRepository.findById(insc.id);
      if (!inscription) continue;

      // Un inscrit qui n'a pas commencé à régler le tarif de la sortie ne
      // peut pas être pointé présent : le paiement doit avoir débuté avant
      // que la sortie ne débute pour lui. Il reste possible de le pointer
      // absent, ou de l'exclure du groupe (cancelInscription) si rien n'a
      // été réglé du tout.
      if (
        insc.presence &&
        Number(inscription.montant_du) > 0 &&
        Number(inscription.montant_paye || 0) <= 0
      ) {
        const nom = inscription.adherent
          ? `${inscription.adherent.prenom} ${inscription.adherent.nom}`
          : `l'inscrit #${inscription.num_adherent}`;
        throw new Error(
          `Impossible de pointer ${nom} présent : aucun paiement n'a encore été enregistré pour cette sortie.`,
        );
      }

      const updated = await this.inscriptionRepository.update(insc.id, {
        presence: insc.presence,
        presence_checked: true,
        presence_check_time: new Date(),
        presence_check_by: userId,
        absence_reason: insc.absence_reason || null,
        absence_justified: insc.absence_justified || false,
      });
      results.push(updated);
    }
    return results;
  }

  async modifierPointage(id_inscription, data, userId) {
    const inscription =
      await this.inscriptionRepository.findById(id_inscription);
    if (!inscription) throw new Error("Inscription non trouvée");
    if (!inscription.presence_checked)
      throw new Error("Cette inscription n'a pas encore été pointée");
    if (
      data.presence &&
      Number(inscription.montant_du) > 0 &&
      Number(inscription.montant_paye || 0) <= 0
    ) {
      throw new Error(
        "Impossible de marquer cet inscrit présent : aucun paiement n'a encore été enregistré pour cette sortie.",
      );
    }
    return await this.inscriptionRepository.update(id_inscription, {
      presence: data.presence,
      absence_reason: data.absence_reason || null,
      absence_justified: data.absence_justified || false,
      presence_check_by: userId,
      presence_check_time: new Date(),
    });
  }

  async annulerPointage(id_inscription, userId) {
    const inscription =
      await this.inscriptionRepository.findById(id_inscription);
    if (!inscription) throw new Error("Inscription non trouvée");
    if (!inscription.presence_checked)
      throw new Error("Cette inscription n'a pas encore été pointée");
    return await this.inscriptionRepository.update(id_inscription, {
      presence_checked: false,
      presence: false,
      presence_check_time: null,
      presence_check_by: null,
      absence_reason: null,
      absence_justified: false,
    });
  }

  async validateSortieData(data) {
    const errors = [];
    if (!data.type)
      errors.push({ field: "type", message: "Le type est requis" });
    if (!data.lieu)
      errors.push({ field: "lieu", message: "Le lieu est requis" });
    if (!data.site)
      errors.push({ field: "site", message: "Le site est requis" });
    if (!data.date_heure)
      errors.push({ field: "date_heure", message: "La date est requise" });
    if (!data.nb_places || data.nb_places < 1)
      errors.push({
        field: "nb_places",
        message: "Le nombre de places doit être supérieur à 0",
      });
    return errors;
  }
}

module.exports = SortieService;
