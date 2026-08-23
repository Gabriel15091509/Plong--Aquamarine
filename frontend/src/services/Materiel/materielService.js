import api from '../api';

class MaterielService {
  async getAll(params = {}) {
    const response = await api.get('/materiels', { params });
    return response.data;
  }

  async getById(numInventaire) {
    const response = await api.get(`/materiels/${numInventaire}`);
    return response.data;
  }

  async getAvailable() {
    const response = await api.get('/materiels/available');
    return response.data;
  }

  async getNeedingMaintenance() {
    const response = await api.get('/materiels/needing-maintenance');
    return response.data;
  }

  async getWithReparations() {
    const response = await api.get('/materiels/with-reparations');
    return response.data;
  }

  async getStats() {
    const response = await api.get('/materiels/stats');
    return response.data;
  }

  async checkAvailability(numInventaire) {
    const response = await api.get(`/materiels/${numInventaire}/availability`);
    return response.data;
  }

  async create(data) {
    const response = await api.post('/materiels', data);
    return response.data;
  }

  async update(numInventaire, data) {
    const response = await api.put(`/materiels/${numInventaire}`, data);
    return response.data;
  }

  async updateEtat(numInventaire, etat) {
    const response = await api.patch(`/materiels/${numInventaire}/etat`, { etat });
    return response.data;
  }

  async updatePhoto(numInventaire, formData) {
    const response = await api.put(`/materiels/${numInventaire}/photo`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  }

  async delete(numInventaire) {
    const response = await api.delete(`/materiels/${numInventaire}`);
    return response.data;
  }

  async bulkDelete(ids) {
    const response = await api.post("/materiels/bulk-delete", { ids });
    return response.data;
  }
}

export default new MaterielService();