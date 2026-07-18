const { Op } = require("sequelize");
const BaseRepository = require("./BaseRepository");
const { Echeance, Echeancier } = require("../models");

class EcheanceRepository extends BaseRepository {
  constructor() {
    super(Echeance);
  }

  async findById(id) {
    return await this.model.findByPk(id, {
      include: [{ model: Echeancier, as: "echeancier" }],
    });
  }

  async findDueInDays(n) {
    const target = new Date();
    target.setDate(target.getDate() + n);
    const dateStr = target.toISOString().slice(0, 10);
    return await this.model.findAll({
      where: { statut: "En attente", date_echeance: dateStr },
      include: [{ model: Echeancier, as: "echeancier" }],
    });
  }

  // Passage en masse "En attente" -> "En retard" pour toute échéance dont la
  // date est dépassée sans paiement — appelé une fois par jour avant l'envoi
  // des rappels, voir EcheancierService.envoyerRappelsEcheances.
  async findAndFlipEnRetard() {
    const today = new Date().toISOString().slice(0, 10);
    const [count] = await this.model.update(
      { statut: "En retard" },
      { where: { statut: "En attente", date_echeance: { [Op.lt]: today } } },
    );
    return count;
  }

  async findEnRetard() {
    return await this.model.findAll({
      where: { statut: "En retard" },
      include: [{ model: Echeancier, as: "echeancier" }],
    });
  }
}

module.exports = EcheanceRepository;
