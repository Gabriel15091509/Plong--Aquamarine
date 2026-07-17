const BaseRepository = require("./BaseRepository");
const { Op } = require("sequelize");
const {
  Adherent,
  User,
} = require("../models");

class AdherentRepository extends BaseRepository {
  constructor() {
    super(Adherent);
  }

  async count(where = {}) {
    return await this.model.count({ where });
  }

  async countInPeriod(dateField, start, end) {
    return await this.model.count({
      where: { [dateField]: { [Op.gte]: start, [Op.lte]: end } },
    });
  }

  // La photo de profil vit sur le compte User partagé (tous rôles), pas sur
  // Adherent : on la récupère via include puis on l'aplatit en "photo" pour
  // que le frontend (qui lit déjà adherent.photo) n'ait rien à changer.
  _withUserPhoto(row) {
    const plain = row.toJSON();
    plain.photo = plain.user?.photo || null;
    delete plain.user;
    return plain;
  }

  async findAllWithPhoto(options = {}) {
    const rows = await this.model.findAll({
      include: [{ model: User, as: "user", attributes: ["photo"] }],
      ...options,
    });
    return rows.map((r) => this._withUserPhoto(r));
  }

  async findByIdWithPhoto(id) {
    const row = await this.model.findByPk(id, {
      include: [{ model: User, as: "user", attributes: ["photo"] }],
    });
    return row ? this._withUserPhoto(row) : null;
  }

  async generateNumAdherent() {
    const year = new Date().getFullYear();
    const prefix = `ADH-${year}-`;
    const count = await this.model.count({
      where: { num_adherent: { [Op.like]: `${prefix}%` } },
    });
    const sequence = String(count + 1).padStart(4, "0");
    return `${prefix}${sequence}`;
  }

  async findWithDetails(id) {
    return await this.model.findByPk(id);
  }

  async findByUserId(user_id) {
    return await this.model.findOne({ where: { user_id } });
  }

  async findByNumAdherents(numAdherents) {
    if (!numAdherents.length) return [];
    return await this.model.findAll({
      where: { num_adherent: { [Op.in]: numAdherents } },
    });
  }

  async findByEmail(email) {
    const row = await this.model.findOne({
      where: { email },
      include: [{ model: User, as: "user", attributes: ["photo"] }],
    });
    return row ? this._withUserPhoto(row) : null;
  }

  async findByNiveau(niveau) {
    return await this.model.findAll({ where: { niveau } });
  }

  async search(query) {
    return await this.model.findAll({
      where: {
        [Op.or]: [
          { nom: { [Op.like]: `%${query}%` } },
          { prenom: { [Op.like]: `%${query}%` } },
          { email: { [Op.like]: `%${query}%` } },
          { num_adherent: { [Op.like]: `%${query}%` } },
        ],
      },
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

  // Segmentation pour la communication ciblée (CDC 3.6.1) : niveau exact
  // (optionnel) et ancienneté minimale en années, dérivée de
  // date_inscription (pas de colonne dédiée). Toujours restreint aux
  // adhérents Actifs — un compte Inactif/Suspendu ne doit pas recevoir de
  // communication du club.
  async findBySegment({ niveau, ancienneteMinAnnees }) {
    const where = { statut: "Actif" };
    if (niveau) where.niveau = niveau;
    if (ancienneteMinAnnees) {
      const seuil = new Date();
      seuil.setFullYear(seuil.getFullYear() - Number(ancienneteMinAnnees));
      where.date_inscription = { [Op.lte]: seuil };
    }
    return await this.model.findAll({ where });
  }
}

module.exports = AdherentRepository;
