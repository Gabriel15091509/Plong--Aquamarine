const { NotFoundError } = require("../utils/errors");

// Un champ optionnel (date OU numérique) rechargé "vide" par un
// formulaire (valeur initiale null en base) est resoumis comme "" plutôt
// que null : Sequelize ne l'exempte pas via allowNull (réservé à une
// vraie valeur null) et échoue soit à la validation ("Invalid date"),
// soit en base avec une erreur Postgres brute non traduite ("invalid
// input syntax for type integer: ''", "for type numeric: ''"...) — ex.
// Plongee.id_seance (séance liée facultative) ou Sortie.tarif_non_
// adherent/latitude/longitude laissés vides. Normalisé ici, au point
// d'entrée commun à tous les create/update de ce service, plutôt que
// dans chaque service pris isolément.
const EMPTY_STRING_UNSAFE_TYPE_KEYS = new Set([
  "DATE",
  "DATEONLY",
  "INTEGER",
  "BIGINT",
  "FLOAT",
  "DOUBLE",
  "DECIMAL",
]);

function sanitizeEmptyOptionalFields(model, data) {
  if (!data || typeof data !== "object") return data;
  const sanitized = { ...data };
  for (const [key, value] of Object.entries(sanitized)) {
    if (value !== "") continue;
    const attribute = model.rawAttributes[key];
    if (attribute && EMPTY_STRING_UNSAFE_TYPE_KEYS.has(attribute.type?.key)) {
      sanitized[key] = null;
    }
  }
  return sanitized;
}

class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async findAll(options = {}) {
    return await this.model.findAll(options);
  }

  async findById(id, options = {}) {
    return await this.model.findByPk(id, options);
  }

  async create(data) {
    return await this.model.create(sanitizeEmptyOptionalFields(this.model, data));
  }

  async update(id, data, options = {}) {
    const instance = await this.findById(id, options);
    if (!instance) throw new NotFoundError('Entity not found');
    return await instance.update(sanitizeEmptyOptionalFields(this.model, data), options);
  }

  async delete(id) {
    const instance = await this.findById(id);
    if (!instance) throw new NotFoundError('Entity not found');
    await instance.destroy();
    return true;
  }

  async findOne(where, options = {}) {
    return await this.model.findOne({ where, ...options });
  }

  async count(where = {}) {
    return await this.model.count({ where });
  }
}

module.exports = BaseRepository;
