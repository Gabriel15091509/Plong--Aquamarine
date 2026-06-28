const BaseRepository = require("./BaseRepository");
const {
  Adherent,
  Adhesion,
  CertificatMedical,
  Paiement,
} = require("../models");

class AdherentRepository extends BaseRepository {
  constructor() {
    super(Adherent);
  }

  // Ajouter cette méthode dans AdherentRepository.js

  async count(where = {}) {
    return await this.model.count({ where });
  }
  async findWithDetails(id) {
    return await this.model.findByPk(id, {
      include: [
        { model: Adhesion },
        { model: CertificatMedical },
        { model: Paiement },
      ],
    });
  }

  async findActiveAdherents() {
    return await this.model.findAll({
      where: { statut: "Actif" },
      order: [
        ["nom", "ASC"],
        ["prenom", "ASC"],
      ],
    });
  }

  async findAdherentsWithExpiringCertificates() {
    const { Op } = require("sequelize");
    const today = new Date();
    const thirtyDaysLater = new Date(today);
    thirtyDaysLater.setDate(today.getDate() + 30);

    const adherents = await this.model.findAll({
      include: [
        {
          model: CertificatMedical,
          where: {
            date_validite: {
              [Op.between]: [today, thirtyDaysLater],
            },
            statut: "Valide",
          },
        },
      ],
    });

    return adherents;
  }
}

module.exports = AdherentRepository;
