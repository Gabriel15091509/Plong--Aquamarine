const { NotFoundError } = require("../utils/errors");

// Un champ date optionnel rechargé "vide" par un formulaire (valeur
// initiale null en base) est resoumis comme "" plutôt que null : Sequelize
// ne l'exempte pas via allowNull (réservé à une vraie valeur null) et
// échoue à la validation ou à l'écriture SQL ("Invalid date"). Normalisé
// ici, au point d'entrée commun à tous les create/update de ce service,
// plutôt que dans chaque service pris isolément.
const DATE_TYPE_KEYS = new Set(["DATE", "DATEONLY"]);

function sanitizeDateFields(model, data) {
  if (!data || typeof data !== "object") return data;
  const sanitized = { ...data };
  for (const [key, value] of Object.entries(sanitized)) {
    if (value !== "") continue;
    const attribute = model.rawAttributes[key];
    if (attribute && DATE_TYPE_KEYS.has(attribute.type?.key)) {
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
    return await this.model.create(sanitizeDateFields(this.model, data));
  }

  async update(id, data, options = {}) {
    const instance = await this.findById(id, options);
    if (!instance) throw new NotFoundError('Entity not found');
    return await instance.update(sanitizeDateFields(this.model, data), options);
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
