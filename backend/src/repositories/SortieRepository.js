const BaseRepository = require("./BaseRepository");
const { Sortie, Inscription, Adherent, User } = require("../models"); // ✅ Inclure User
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

  async findAllWithInscriptions() {
    return await this.model.findAll({
      include: [
        {
          model: Inscription,
          as: "inscriptions",
          include: [
            {
              model: Adherent,
              as: "adherent",
              attributes: [
                "num_adherent",
                "nom",
                "prenom",
                "email",
                "telephone",
                "niveau",
              ],
            },
          ],
        },
      ],
      order: [["date_heure", "ASC"]],
    });
  }

  // ✅ Méthode pour le pointage avec l'utilisateur (checker)
  async findByIdWithPointage(id) {
    return await this.model.findOne({
      where: { id_sortie: id },
      include: [
        {
          model: Inscription,
          as: "inscriptions",
          include: [
            {
              model: Adherent,
              as: "adherent",
              attributes: [
                "num_adherent",
                "nom",
                "prenom",
                "email",
                "telephone",
                "niveau",
              ],
            },
            {
              model: User,
              as: "checker", // ✅ Alias correct pour User
              attributes: ["id", "name", "email"],
            },
          ],
        },
      ],
    });
  }

  // ✅ Méthode pour les détails sans User (pour éviter les erreurs)
  async findByIdWithInscriptions(id) {
    return await this.model.findOne({
      where: { id_sortie: id },
      include: [
        {
          model: Inscription,
          as: "inscriptions",
          include: [
            {
              model: Adherent,
              as: "adherent",
              attributes: [
                "num_adherent",
                "nom",
                "prenom",
                "email",
                "telephone",
                "niveau",
              ],
            },
          ],
        },
      ],
    });
  }
}

module.exports = SortieRepository;
