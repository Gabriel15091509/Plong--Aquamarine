const BaseRepository = require("./BaseRepository");
const { Echeancier, Echeance } = require("../models");

class EcheancierRepository extends BaseRepository {
  constructor() {
    super(Echeancier);
  }

  async findByReference(type_paiement, reference_id) {
    return await this.model.findAll({
      where: { type_paiement, reference_id: String(reference_id) },
      include: [{ model: Echeance, as: "echeances" }],
      order: [
        ["created_at", "DESC"],
        [{ model: Echeance, as: "echeances" }, "numero", "ASC"],
      ],
    });
  }

  async findByAdherent(num_adherent) {
    return await this.model.findAll({
      where: { num_adherent },
      include: [{ model: Echeance, as: "echeances" }],
      order: [
        ["created_at", "DESC"],
        [{ model: Echeance, as: "echeances" }, "numero", "ASC"],
      ],
    });
  }
}

module.exports = EcheancierRepository;
