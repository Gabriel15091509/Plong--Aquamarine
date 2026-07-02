const BaseRepository = require("./BaseRepository");
const { Formation, Competence } = require("../models");

class FormationRepository extends BaseRepository {
  constructor() {
    super(Formation);
  }

  async findAll() {
    return await this.model.findAll({
      order: [["date_debut", "DESC"]],
    });
  }

  async findById(id) {
    return await this.model.findByPk(id);
  }

  async findActive() {
    return await this.model.findAll({
      where: { statut: "En cours" },
      order: [["date_debut", "DESC"]],
    });
  }

  async findByAdherent(num_adherent) {
    return await this.model.findAll({
      where: { num_adherent },
      order: [["date_debut", "DESC"]],
    });
  }

  async findWithCompetences(id) {
    return await this.model.findByPk(id, {
      include: [{ model: Competence, as: "competences" }],
    });
  }

  // ✅ Stats calculées en JS — pas de GROUP BY qui peut planter
  async getStats() {
    const formations = await this.model.findAll();
    return {
      total: formations.length,
      enCours: formations.filter((f) => f.statut === "En cours").length,
      terminees: formations.filter((f) => f.statut === "Terminée").length,
      abandonnees: formations.filter((f) => f.statut === "Abandonnée").length,
    };
  }
}

module.exports = FormationRepository;
