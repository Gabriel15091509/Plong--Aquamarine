const { Inscription, Adherent, Sortie } = require("../models");

class InscriptionRepository {
  // ✅ Mise à jour
  async update(id, data) {
    console.log("📝 Repository update - ID:", id, "Data:", data);

    const inscription = await Inscription.findByPk(id);
    if (!inscription) {
      throw new Error("Inscription non trouvée");
    }

    await inscription.update(data);
    return inscription;
  }

  async findById(id) {
    return await Inscription.findByPk(id, {
      include: [
        { model: Adherent, as: "adherent" },
        { model: Sortie, as: "sortie" },
      ],
    });
  }

  async findAll() {
    return await Inscription.findAll({
      include: [
        { model: Adherent, as: "adherent" },
        { model: Sortie, as: "sortie" },
      ],
      order: [["created_at", "DESC"]],
    });
  }

  async create(data) {
    return await Inscription.create(data);
  }

  async delete(id) {
    const inscription = await Inscription.findByPk(id);
    if (!inscription) {
      throw new Error("Inscription non trouvée");
    }
    await inscription.destroy();
    return true;
  }

  async findConfirmationsBySortie(id_sortie) {
    return await Inscription.findAll({
      where: {
        id_sortie,
        statut: "Confirmée",
      },
      include: [{ model: Adherent, as: "adherent" }],
    });
  }

  async findByAdherentAndSortie(num_adherent, id_sortie) {
    return await Inscription.findOne({
      where: {
        num_adherent,
        id_sortie,
      },
    });
  }

  async getWaitlistBySortie(id_sortie) {
    return await Inscription.findAll({
      where: {
        id_sortie,
        statut: "Liste d'attente",
      },
      order: [["rang_liste_attente", "ASC"]],
      include: [{ model: Adherent, as: "adherent" }],
    });
  }

  async getInscriptionStats() {
    const inscriptions = await Inscription.findAll();
    const stats = {
      total: inscriptions.length,
      enAttente: 0,
      confirmees: 0,
      annulees: 0,
      listeAttente: 0,
    };

    inscriptions.forEach((i) => {
      switch (i.statut) {
        case "En attente":
          stats.enAttente++;
          break;
        case "Confirmée":
          stats.confirmees++;
          break;
        case "Annulée":
          stats.annulees++;
          break;
        case "Liste d'attente":
          stats.listeAttente++;
          break;
      }
    });

    return stats;
  }
}

module.exports = InscriptionRepository;
