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
      // Le tarif est calculé et figé par InscriptionService (computeMontantDu)
      // avant l'appel ici — cette liste blanche les oubliait, si bien que
      // montant_du repartait toujours sur son défaut (null, donc "Gratuit"
      // à l'affichage) au lieu du tarif réel de la sortie, quel que soit ce
      // que le service avait calculé.
      montant_du: data.montant_du ?? null,
      montant_paye: data.montant_paye ?? 0,
      paye: data.paye ?? false,
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

  // Sortie passée "En cours" (départ effectif) : les inscrits pas encore
  // confirmés (En attente / Liste d'attente) n'ont plus vocation à
  // embarquer — utilisé par SortieService.annulerInscriptionsNonConfirmees
  // pour les annuler en bloc plutôt que de les laisser trainer, que la
  // transition soit automatique (cron demarrerSortiesEchues) ou manuelle
  // (formulaire de sortie). Bulk update direct (comme
  // SortieRepository.demarrerSortiesEchues) : pas besoin de charger chaque
  // ligne, ni de repasser par les hooks du modèle pour un simple champ
  // statut.
  async annulerNonConfirmeesBySortie(id_sortie) {
    const [count] = await Inscription.update(
      { statut: "Annulée", rang_liste_attente: null },
      {
        where: {
          id_sortie,
          statut: { [Op.in]: ["En attente", "Liste d'attente"] },
        },
      },
    );
    return count;
  }

  // Sortie replanifiée après une annulation météo (voir SortieService.
  // replanifier) : la place n'est plus garantie à la nouvelle date, chaque
  // inscription "Confirmée" repasse "En attente" avec reconfirmation_requise
  // — seul cas où l'adhérent peut ensuite se reconfirmer lui-même (voir
  // InscriptionService.confirmInscription). Bulk update direct, même motif
  // qu'annulerNonConfirmeesBySortie ci-dessus.
  async remettreEnAttenteConfirmeesBySortie(id_sortie) {
    const [count] = await Inscription.update(
      { statut: "En attente", date_confirmation: null, reconfirmation_requise: true },
      { where: { id_sortie, statut: "Confirmée" } },
    );
    return count;
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

  // Nombre d'inscriptions "En attente" (badge Sidebar.jsx) : un simple COUNT,
  // sans charger les lignes ni leur `.sortie` — voir InscriptionService.
  // getPendingCount pour le pourquoi (findAll()+withAdherent() est bien trop
  // coûteux rien que pour afficher un chiffre).
  async countPending() {
    return await Inscription.count({ where: { statut: "En attente" } });
  }

  // Inscriptions "En attente" avec leur sortie : sert au badge d'un moniteur,
  // qui ne compte que celles de SES sorties (voir InscriptionService.
  // getPendingCount) — le filtre par encadrant se fait sur le tableau
  // Sortie.encadrants, en JS (peu de lignes "En attente").
  async findPending() {
    return await Inscription.findAll({
      where: { statut: "En attente" },
      include: [{ model: Sortie, as: "sortie" }],
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
