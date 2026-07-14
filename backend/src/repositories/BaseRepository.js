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
    return await this.model.create(data);
  }

  async update(id, data, options = {}) {
    const instance = await this.findById(id, options);
    if (!instance) throw new Error('Entity not found');
    return await instance.update(data, options);
  }

  async delete(id) {
    const instance = await this.findById(id);
    if (!instance) throw new Error('Entity not found');
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