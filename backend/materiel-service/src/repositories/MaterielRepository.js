const BaseRepository = require("./BaseRepository");
const { Materiel, Reparation } = require("../models");
const { Op } = require("sequelize");

class MaterielRepository extends BaseRepository {
  constructor() {
    super(Materiel);
  }

  async findAvailableMateriel() {
    return await this.model.findAll({
      where: {
        etat: ["Neuf", "Bon"],
        date_prochaine_echeance: { [Op.gte]: new Date() },
      },
    });
  }

  async findMaterielNeedingMaintenance() {
    const today = new Date();
    const threeMonthsLater = new Date(today);
    threeMonthsLater.setMonth(today.getMonth() + 3);

    return await this.model.findAll({
      where: {
        [Op.or]: [
          { date_prochaine_echeance: { [Op.lte]: threeMonthsLater } },
          { etat: "À réparer" },
        ],
      },
    });
  }

  async findMaterielWithReparations() {
    return await this.model.findAll({
      include: [
        {
          model: Reparation,
          as: "reparations",
          where: { date_retour: null },
          required: false,
        },
      ],
    });
  }

  async getStats() {
    const stats = await this.model.findAll({
      attributes: [
        "categorie",
        "etat",
        [
          this.model.sequelize.fn(
            "COUNT",
            this.model.sequelize.col("num_inventaire"),
          ),
          "count",
        ],
      ],
      group: ["categorie", "etat"],
    });
    return stats;
  }

  // Utilisé par le trend du dashboard (monolithe) via HTTP — voir
  // FormationRepository.countInPeriod pour le motif d'origine.
  async countInPeriod(dateField, start, end) {
    return await this.model.count({
      where: { [dateField]: { [Op.gte]: start, [Op.lte]: end } },
    });
  }
}

module.exports = MaterielRepository;
