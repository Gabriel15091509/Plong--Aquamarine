const BaseService = require("./BaseService");
const InscriptionRepository = require("../repositories/InscriptionRepository");
const SortieService = require("./SortieService");

class InscriptionService extends BaseService {
  constructor() {
    const repository = new InscriptionRepository();
    super(repository);
    this.inscriptionRepository = repository;
    this.sortieService = new SortieService();
  }

  // ✅ Mise à jour
  async update(id, data) {
    console.log("📝 Service update - ID:", id, "Data:", data);

    const inscription = await this.inscriptionRepository.findById(id);
    if (!inscription) {
      throw new Error("Inscription non trouvée");
    }

    const allowedFields = [
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

    const updateData = {};
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }

    return await this.inscriptionRepository.update(id, updateData);
  }

  async getConfirmationsBySortie(id_sortie) {
    return await this.inscriptionRepository.findConfirmationsBySortie(
      id_sortie,
    );
  }

  async getByAdherentAndSortie(num_adherent, id_sortie) {
    return await this.inscriptionRepository.findByAdherentAndSortie(
      num_adherent,
      id_sortie,
    );
  }

  async getWaitlistBySortie(id_sortie) {
    return await this.inscriptionRepository.getWaitlistBySortie(id_sortie);
  }

  async getInscriptionStats() {
    return await this.inscriptionRepository.getInscriptionStats();
  }

  async createInscription(data) {
    const existing = await this.getByAdherentAndSortie(
      data.num_adherent,
      data.id_sortie,
    );
    if (existing) {
      throw new Error("Cet adhérent est déjà inscrit à cette sortie");
    }

    const sortie = await this.sortieService.getSortieDetails(data.id_sortie);
    if (!sortie) {
      throw new Error("Sortie non trouvée");
    }

    if (sortie.statut === "Annulée") {
      throw new Error("Cette sortie est annulée");
    }

    const confirmedCount = sortie.inscriptions
      ? sortie.inscriptions.filter((i) => i.statut === "Confirmée").length
      : 0;
    const placesDisponibles = sortie.nb_places - confirmedCount;

    let statut = "Confirmée";
    let rangListeAttente = null;

    if (placesDisponibles <= 0) {
      statut = "Liste d'attente";
      const waitlist = await this.getWaitlistBySortie(data.id_sortie);
      rangListeAttente = waitlist.length + 1;
    }

    return await this.inscriptionRepository.create({
      ...data,
      statut,
      rang_liste_attente: rangListeAttente,
    });
  }

  async confirmInscription(id) {
    const inscription = await this.getById(id);
    if (!inscription) throw new Error("Inscription non trouvée");

    if (inscription.statut === "Liste d'attente") {
      const sortie = await this.sortieService.getSortieDetails(
        inscription.id_sortie,
      );
      const confirmedCount = sortie.inscriptions.filter(
        (i) => i.statut === "Confirmée",
      ).length;
      const placesDisponibles = sortie.nb_places - confirmedCount;

      if (placesDisponibles <= 0) {
        throw new Error("Plus de places disponibles");
      }
    }

    inscription.statut = "Confirmée";
    inscription.date_confirmation = new Date();
    await inscription.save();

    return inscription;
  }

  async cancelInscription(id) {
    const inscription = await this.getById(id);
    if (!inscription) throw new Error("Inscription non trouvée");

    inscription.statut = "Annulée";
    await inscription.save();

    if (inscription.statut === "Liste d'attente") {
      const waitlist = await this.getWaitlistBySortie(inscription.id_sortie);
      for (const wait of waitlist) {
        if (wait.rang_liste_attente > inscription.rang_liste_attente) {
          wait.rang_liste_attente -= 1;
          await wait.save();
        }
      }
    }

    return inscription;
  }

  async validateInscriptionData(data) {
    const errors = [];

    if (!data.num_adherent) errors.push("L'adhérent est requis");
    if (!data.id_sortie) errors.push("La sortie est requise");

    return errors;
  }
}

module.exports = InscriptionService;
