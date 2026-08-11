const BaseRepository = require("./BaseRepository");
const { Sortie, Inscription } = require("../models");
const { Op } = require("sequelize");

class SortieRepository extends BaseRepository {
  constructor() {
    super(Sortie);
  }

  async findAll() {
    return await this.model.findAll({
      order: [["date_heure", "ASC"]],
    });
  }

  async findById(id) {
    return await this.model.findOne({
      where: { id_sortie: id },
    });
  }

  async findUpcoming() {
    const today = new Date();
    return await this.model.findAll({
      where: {
        date_heure: { [Op.gte]: today },
        statut: { [Op.in]: ["Planifiée", "En cours"] },
      },
      order: [["date_heure", "ASC"]],
    });
  }

  // Légère (pas d'infos adhérent) : utilisée pour calculer le nombre de
  // places restantes sans exposer les coordonnées des inscrits à toute
  // personne consultant la liste des sorties.
  async findAllWithInscriptionCounts() {
    return await this.model.findAll({
      include: [
        {
          model: Inscription,
          as: "inscriptions",
          attributes: ["id_inscription", "statut"],
        },
      ],
      order: [["date_heure", "ASC"]],
    });
  }

  async findUpcomingWithInscriptionCounts() {
    const today = new Date();
    return await this.model.findAll({
      where: {
        date_heure: { [Op.gte]: today },
        statut: { [Op.in]: ["Planifiée", "En cours"] },
      },
      include: [
        {
          model: Inscription,
          as: "inscriptions",
          attributes: ["id_inscription", "statut"],
        },
      ],
      order: [["date_heure", "ASC"]],
    });
  }

  // Adherent (identite-service) a quitté ce schéma : plus d'include imbriqué
  // ici — voir SortieService qui recompose `.inscriptions[].adherent` via
  // identiteClient après cet appel.
  async findAllWithInscriptions() {
    return await this.model.findAll({
      include: [
        {
          model: Inscription,
          as: "inscriptions",
        },
      ],
      order: [["date_heure", "ASC"]],
    });
  }

  async findByIdWithPointage(id) {
    return await this.model.findOne({
      where: { id_sortie: id },
      include: [
        {
          model: Inscription,
          as: "inscriptions",
        },
      ],
    });
  }

  async findByIdWithInscriptions(id) {
    return await this.model.findOne({
      where: { id_sortie: id },
      include: [
        {
          model: Inscription,
          as: "inscriptions",
        },
      ],
    });
  }

  // Sorties du lendemain (jour calendaire), avec inscriptions incluses —
  // base du rappel 24h avant sortie (CDC 3.2.2).
  async findDemainAvecInscriptions() {
    const now = new Date();
    const debut = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
    const fin = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23, 59, 59, 999);
    return await this.model.findAll({
      where: {
        date_heure: { [Op.between]: [debut, fin] },
        statut: { [Op.ne]: "Annulée" },
      },
      include: [
        {
          model: Inscription,
          as: "inscriptions",
        },
      ],
    });
  }

  async countInPeriod(dateField, start, end) {
    return await this.model.count({
      where: { [dateField]: { [Op.gte]: start, [Op.lte]: end } },
    });
  }

  // Verrou pessimiste ("SELECT ... FOR UPDATE") sur la ligne de la sortie,
  // à tenir le temps de compter les inscriptions Confirmée puis d'écrire la
  // nouvelle inscription/le nouveau statut dans la même transaction —
  // empêche deux confirmations concurrentes de lire toutes les deux
  // "1 place restante" et de faire passer nb_inscrits au-dessus de
  // nb_places (vérifié "check-then-act" sans verrou jusqu'ici). Sans
  // include (comme findById avec `options.lock` dans InscriptionRepository) :
  // Postgres/Sequelize ignore silencieusement FOR UPDATE sur une requête
  // avec jointure.
  async lockForCapacityCheck(id, transaction) {
    return await this.model.findOne({
      where: { id_sortie: id },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
  }
}

module.exports = SortieRepository;
