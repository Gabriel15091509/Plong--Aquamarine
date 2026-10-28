const BaseRepository = require("./BaseRepository");
const { Brevet, Adherent } = require("../models");

class BrevetRepository extends BaseRepository {
  constructor() {
    super(Brevet);
  }

  // Historique complet, tous adhérents confondus (vue président/moniteur) —
  // enrichi du nom/prénom/niveau courant de l'adhérent : Brevet et Adherent
  // vivent dans le même service/schéma, donc un vrai `include` Sequelize
  // suffit ici (contrairement aux domaines externes résolus par HTTP
  // ailleurs dans le code).
  async findAllWithAdherent() {
    return await this.model.findAll({
      include: [
        {
          model: Adherent,
          as: "adherent",
          // "photo" en plus (voir BrevetList.jsx/BrevetDetails.jsx, même
          // avatar rond que FormationList.jsx) : sans elle, chaque ligne
          // retombait systématiquement sur l'icône générique, même pour un
          // adhérent qui a bien une photo de profil.
          attributes: ["num_adherent", "nom", "prenom", "niveau", "photo"],
        },
      ],
      order: [["date_obtention", "DESC"]],
    });
  }

  async findByAdherent(num_adherent) {
    return await this.model.findAll({
      where: { num_adherent },
      order: [["date_obtention", "DESC"]],
    });
  }
}

module.exports = BrevetRepository;
