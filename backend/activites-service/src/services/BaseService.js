class BaseService {
  constructor(repository) {
    this.repository = repository;
  }

  async getAll(options = {}) {
    return await this.repository.findAll(options);
  }

  async getById(id, options = {}) {
    return await this.repository.findById(id, options);
  }

  async create(data) {
    return await this.repository.create(data);
  }

  async update(id, data) {
    return await this.repository.update(id, data);
  }

  async delete(id) {
    return await this.repository.delete(id);
  }
}

module.exports = BaseService;
