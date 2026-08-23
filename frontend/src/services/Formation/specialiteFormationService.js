import api from '../api';

class SpecialiteFormationService {
  async getAll(params = {}) {
    const response = await api.get('/specialites-formation', { params });
    return response.data;
  }

  async getById(id) {
    const response = await api.get(`/specialites-formation/${id}`);
    return response.data;
  }

  async getByAdherent(numAdherent) {
    const response = await api.get(`/specialites-formation/adherent/${numAdherent}`);
    return response.data;
  }

  async getByMoniteur(idMoniteur) {
    const response = await api.get(`/specialites-formation/moniteur/${idMoniteur}`);
    return response.data;
  }

  async create(data) {
    const response = await api.post('/specialites-formation', data);
    return response.data;
  }

  async update(id, data) {
    const response = await api.put(`/specialites-formation/${id}`, data);
    return response.data;
  }

  async delete(id) {
    const response = await api.delete(`/specialites-formation/${id}`);
    return response.data;
  }

  async bulkDelete(ids) {
    const response = await api.post("/specialites-formation/bulk-delete", { ids });
    return response.data;
  }
}

export default new SpecialiteFormationService();
