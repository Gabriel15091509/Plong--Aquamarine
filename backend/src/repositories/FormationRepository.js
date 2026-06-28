const BaseRepository = require("./BaseRepository");
const { Formation, Competence } = require("../models");
const { Op } = require("sequelize");

class FormationRepository extends BaseRepository {
  constructor() {
    super(Formation);
  }

  async findFormationsByAdherent(num_adherent) {
    return await this.model.findAll({
      where: { num_adherent },
      order: [["date_debut", "DESC"]],
    });
  }

  async findActiveFormations() {
    return await this.model.findAll({
      where: { statut: "En cours" },
    });
  }

  // ✅ Ajout de getStats
  async getStats() {
    const stats = await this.model.findAll({
      attributes: [
        "statut",
        [
          this.model.sequelize.fn(
            "COUNT",
            this.model.sequelize.col("id_formation"),
          ),
          "count",
        ],
      ],
      group: ["statut"],
    });
    return stats;
  }

  async findFormationWithCompetences(id) {
    return await this.model.findByPk(id, {
      include: [
        {
          model: Competence,
          as: "competences",
        },
      ],
    });
  }
}

module.exports = FormationRepository;
