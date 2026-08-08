const { Op } = require("sequelize");
const { Inscription, Sortie } = require("../models");
const { NotFoundError } = require("../utils/errors");

// Adherent (identite-service) a quitté ce schéma : plus d'include Sequelize
// possible ici — voir InscriptionService qui recompose `.adherent` via
// identiteClient après chaque appel qui en a besoin.
class InscriptionRepository {
  async findAll() {
    return await Inscription.findAll({
      include: [{ model: Sortie, as: "sortie" }],
      order: [["created_at", "DESC"]],
    });
  }

  async findByAdherent(num_adherent) {
    return await Inscription.findAll({
      where: { num_adherent },
      include: [{ model: Sortie, as: "sortie" }],
      order: [["created_at", "DESC"]],
    });
  }

  async findById(id, options = {}) {
    // Sans jointure quand un verrou de ligne est demandé : Postgres/Sequelize
    // ignore silencieusement "FOR UPDATE" sur une requête avec LEFT OUTER
    // JOIN, ce qui désactivait le verrou anti-doublon de enregistrerPaiement
    // sans erreur ni avertissement.
    if (options.lock) {
      return await Inscription.findByPk(id, options);
    }
    return await Inscription.findByPk(id, {
      include: [{ model: Sortie, as: "sortie" }],
      ...options,
    });
  }

  async create(data, options = {}) {
    const cleanData = {
      num_adherent: data.num_adherent,
      id_sortie: parseInt(data.id_sortie),
      statut: data.statut || "En attente",
      rang_liste_attente: data.rang_liste_attente || null,
      presence: data.presence || false,
      presence_checked: false,
      presence_check_by: null,
      date_confirmation: data.date_confirmation || null,
    };

    return await Inscription.create(cleanData, options);
  }

  async update(id, data, options = {}) {
    const inscription = await Inscription.findByPk(id, options);
    if (!inscription) {
      throw new NotFoundError("Inscription non trouvée");
    }

    await inscription.update(data, options);
    return inscription;
  }

  async delete(id) {
    const inscription = await Inscription.findByPk(id);
    if (!inscription) {
      throw new NotFoundError("Inscription non trouvée");
    }
    await inscription.destroy();
    return true;
  }

  // Compte à tenir DANS la transaction qui a posé le verrou sur la sortie
  // (voir SortieRepository.lockForCapacityCheck) : lu et écrit sous le même
  // verrou, deux confirmations concurrentes ne peuvent plus lire le même
  // compte "avant écriture" et déborder ensemble de nb_places.
  async countConfirmedBySortie(id_sortie, excludeInscriptionId, transaction) {
    const where = { id_sortie, statut: "Confirmée" };
    if (excludeInscriptionId) {
      where.id_inscription = { [Op.ne]: excludeInscriptionId };
    }
    return await Inscription.count({ where, transaction });
  }

  async findConfirmationsBySortie(id_sortie) {
    return await Inscription.findAll({
      where: {
        id_sortie,
        statut: "Confirmée",
      },
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

  async getWaitlistBySortie(id_sortie, transaction) {
    return await Inscription.findAll({
      where: {
        id_sortie,
        statut: "Liste d'attente",
      },
      order: [["rang_liste_attente", "ASC"]],
      transaction,
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
