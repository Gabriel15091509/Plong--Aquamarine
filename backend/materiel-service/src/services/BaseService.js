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

  // Suppression groupée : rejoue this.delete pour chaque id plutôt qu'une
  // requête bulk brute — respecte automatiquement les contrôles
  // d'autorisation propres à toute sous-classe qui surcharge delete
  // (résolution polymorphique de this.delete), sans rien à dupliquer ici.
  // Résultat détaillé par id (jamais tout-ou-rien) : une ligne en échec
  // (règle métier, déjà supprimée...) ne doit pas bloquer les autres.
  async bulkDelete(ids, user = null, authHeader = null) {
    const results = [];
    for (const id of ids) {
      try {
        await this.delete(id, user, authHeader);
        results.push({ id, success: true });
      } catch (error) {
        results.push({ id, success: false, message: error.message });
      }
    }
    return results;
  }
}

module.exports = BaseService;
