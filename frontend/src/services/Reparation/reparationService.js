import api from '../api';

class ReparationService {
  async getAll(params = {}) {
    const response = await api.get('/reparations', { params });
    return response.data;
  }

  async getById(id) {
    const response = await api.get(`/reparations/${id}`);
    return response.data;
  }

  async getEnCours() {
    const response = await api.get('/reparations/en-cours');
    return response.data;
  }

  async getByMateriel(numInventaire) {
    const response = await api.get(`/reparations/materiel/${numInventaire}`);
    return response.data;
  }

  async create(data) {
    const response = await api.post('/reparations', data);
    return response.data;
  }

  async terminer(id, data) {
    const response = await api.patch(`/reparations/${id}/terminer`, data);
    return response.data;
  }

  async update(id, data) {
    const response = await api.put(`/reparations/${id}`, data);
    return response.data;
  }

  async delete(id) {
    const response = await api.delete(`/reparations/${id}`);
    return response.data;
  }

  async bulkDelete(ids) {
    const response = await api.post("/reparations/bulk-delete", { ids });
    return response.data;
  }
}

export default new ReparationService();
