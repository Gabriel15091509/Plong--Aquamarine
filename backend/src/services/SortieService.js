const BaseService = require("./BaseService");
const SortieRepository = require("../repositories/SortieRepository");
const InscriptionRepository = require("../repositories/InscriptionRepository");

class SortieService extends BaseService {
  constructor() {
    const repository = new SortieRepository();
    super(repository);
    this.sortieRepository = repository;
    this.inscriptionRepository = new InscriptionRepository();
  }

  async getAll() {
    return await this.sortieRepository.findAll();
  }

  async getUpcomingSorties() {
    return await this.sortieRepository.findUpcoming();
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
      // ✅ date_heure au lieu de date_sortie
      aVenir: sorties.filter(
        (s) => new Date(s.date_heure) > now && s.statut !== "Annulée",
      ).length,
      passees: sorties.filter(
        (s) => new Date(s.date_heure) < now && s.statut !== "Annulée",
      ).length,
      annulees: sorties.filter((s) => s.statut === "Annulée").length,
    };
  }

  async getSortieDetails(id) {
    return await this.sortieRepository.findByIdWithInscriptions(id);
  }

  async getById(id) {
    return await this.sortieRepository.findById(id);
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

  async getPointageBySortie(id_sortie) {
    const sortie =
      await this.sortieRepository.findByIdWithInscriptions(id_sortie);
    if (!sortie) throw new Error("Sortie non trouvée");
    if (sortie.inscriptions) {
      sortie.inscriptions.sort((a, b) => {
        const nomA = a.adherent?.name || "";
        const nomB = b.adherent?.name || "";
        return nomA.localeCompare(nomB);
      });
    }
    return sortie;
  }

  async enregistrerPointage(id_sortie, inscriptions, userId) {
    const sortie = await this.sortieRepository.findById(id_sortie);
    if (!sortie) throw new Error("Sortie non trouvée");

    // ✅ date_heure au lieu de date_sortie
    const dateSortie = new Date(sortie.date_heure);
    if (dateSortie > new Date())
      throw new Error("Impossible de pointer une sortie future");

    const results = [];
    for (const insc of inscriptions) {
      const inscription = await this.inscriptionRepository.findById(insc.id);
      if (!inscription) continue;
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
    // ✅ date_heure au lieu de date_sortie
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
