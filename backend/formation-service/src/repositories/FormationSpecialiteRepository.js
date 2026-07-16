const BaseRepository = require("./BaseRepository");
const { FormationSpecialite } = require("../models");

class FormationSpecialiteRepository extends BaseRepository {
  constructor() {
    super(FormationSpecialite);
  }

  async findAll() {
    return await this.model.findAll({
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
}

module.exports = FormationSpecialiteRepository;
