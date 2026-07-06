const { Inscription, Adherent, Sortie } = require("../models");

class InscriptionRepository {
  async findAll() {
    return await Inscription.findAll({
      include: [
        { model: Adherent, as: "adherent" },
        { model: Sortie, as: "sortie" },
      ],
      order: [["created_at", "DESC"]],
    });
  }

  async findByAdherent(num_adherent) {
    return await Inscription.findAll({
      where: { num_adherent },
      include: [
        { model: Adherent, as: "adherent" },
        { model: Sortie, as: "sortie" },
      ],
      order: [["created_at", "DESC"]],
    });
  }

  async findById(id) {
    return await Inscription.findByPk(id, {
      include: [
        { model: Adherent, as: "adherent" },
        { model: Sortie, as: "sortie" },
      ],
    });
  }

  async create(data) {
    console.log("📝 Repository create - Data:", JSON.stringify(data, null, 2));

    try {
      const cleanData = {
        num_adherent: parseInt(data.num_adherent),
        id_sortie: parseInt(data.id_sortie),
        statut: data.statut || "En attente",
        rang_liste_attente: data.rang_liste_attente || null,
        presence: data.presence || false,
        presence_checked: false,
        presence_check_by: null,
        date_confirmation: data.date_confirmation || null,
      };

      const inscription = await Inscription.create(cleanData);
      console.log("✅ Inscription créée:", inscription.id_inscription);
      return inscription;
    } catch (error) {
      console.error("❌ Erreur repository create:", error);
      console.error("❌ Erreur details:", error.errors);
      throw error;
    }
  }

  async update(id, data) {
    console.log("📝 Repository update - ID:", id, "Data:", data);

    const inscription = await Inscription.findByPk(id);
    if (!inscription) {
      throw new Error("Inscription non trouvée");
    }

    await inscription.update(data);
    return inscription;
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
    return this.buildStats(inscriptions);
  }

  async getInscriptionStatsByAdherent(num_adherent) {
    const inscriptions = await Inscription.findAll({
      where: { num_adherent },
    });
    return this.buildStats(inscriptions);
  }

  buildStats(inscriptions) {
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
