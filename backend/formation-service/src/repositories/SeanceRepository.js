const BaseRepository = require("./BaseRepository");
const { Seance, Formation } = require("../models");

class SeanceRepository extends BaseRepository {
  constructor() {
    super(Seance);
  }

  async findByFormation(id_formation) {
    return await this.model.findAll({
      where: { id_formation },
      order: [["date_seance", "ASC"]],
    });
  }

  // Séances pratiques encore à faire pour les formations en cours d'un
  // adhérent — sert à proposer, lors de la validation d'une plongée de type
  // "Formation" (activites-service), la séance à laquelle elle correspond.
  async findPlanifieesByAdherent(num_adherent) {
    return await this.model.findAll({
      where: { statut: "Planifiée", type_seance: "Pratique" },
      include: [
        {
          model: Formation,
          as: "formation",
          where: { num_adherent, statut: "En cours" },
        },
      ],
      order: [["date_seance", "ASC"]],
    });
  }
}

module.exports = SeanceRepository;
