const BaseRepository = require("./BaseRepository");
const { Sortie, Inscription, User } = require("../models");
const { Op } = require("sequelize");

class SortieRepository extends BaseRepository {
  constructor() {
    super(Sortie);
  }

  async findAll() {
    return await this.model.findAll({
      order: [["date_heure", "ASC"]], // ✅ date_heure
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
        date_heure: { [Op.gte]: today }, // ✅ date_heure
        statut: { [Op.in]: ["Planifiée", "En cours"] },
      },
      order: [["date_heure", "ASC"]], // ✅ date_heure
    });
  }

  async findAllWithInscriptions() {
    return await this.model.findAll({
      include: [{ model: Inscription, as: "inscriptions" }],
      order: [["date_heure", "ASC"]], // ✅ date_heure
    });
  }

  async findByIdWithInscriptions(id) {
    return await this.model.findOne({
      where: { id_sortie: id },
      include: [
        {
          model: Inscription,
          as: "inscriptions",
          include: [
            {
              model: User,
              as: "adherent",
              attributes: ["id", "name", "email", "phone", "niveau"],
            },
          ],
        },
      ],
    });
  }
}

module.exports = SortieRepository;
