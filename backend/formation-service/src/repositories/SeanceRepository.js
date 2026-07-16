const BaseRepository = require("./BaseRepository");
const { Seance } = require("../models");

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
}

module.exports = SeanceRepository;
