const BaseRepository = require("./BaseRepository");
const { Formation, Competence } = require("../models");
const { Op, where, col } = require("sequelize");

class FormationRepository extends BaseRepository {
  constructor() {
    super(Formation);
  }

  async findAll() {
    return await this.model.findAll({
      order: [["date_debut", "DESC"]],
    });
  }

  async findById(id, options = {}) {
    return await this.model.findByPk(id, options);
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

  async findByMoniteur(id_moniteur) {
    return await this.model.findAll({
      where: { id_moniteur },
      order: [["date_debut", "DESC"]],
    });
  }

  async findWithCompetences(id) {
    return await this.model.findByPk(id, {
      include: [{ model: Competence, as: "competences" }],
    });
  }

  async getStats() {
    const formations = await this.model.findAll();
    return {
      total: formations.length,
      enCours: formations.filter((f) => f.statut === "En cours").length,
      terminees: formations.filter((f) => f.statut === "Terminée").length,
      abandonnees: formations.filter((f) => f.statut === "Abandonnée").length,
    };
  }

  async countInPeriod(dateField, start, end) {
    return await this.model.count({
      where: { [dateField]: { [Op.gte]: start, [Op.lte]: end } },
    });
  }

  // Badge Sidebar ("formations prêtes à terminer") : COUNT léger côté
  // serveur — même motif que InscriptionRepository.countPending. Même
  // filtre que FormationService.tryAutoComplete côté "séances" (celui-ci
  // vérifie aussi les compétences, non exprimable ici sans jointure ; une
  // formation qui reste comptée ici après un tryAutoComplete manqué est
  // justement celle qui a besoin d'une action manuelle du moniteur).
  // nb_seances_prevues > 0 exclut à la fois null et 0 (comparaison SQL avec
  // NULL toujours fausse) — équivalent au test JS `f.nb_seances_prevues`.
  async countPretesATerminer() {
    return await this.model.count({
      where: {
        statut: "En cours",
        nb_seances_prevues: { [Op.gt]: 0 },
        [Op.and]: [where(col("nb_seances_realisees"), Op.gte, col("nb_seances_prevues"))],
      },
    });
  }
}

module.exports = FormationRepository;
