import api from '../api';

class FormationService {
  async getAll(params = {}) {
    const response = await api.get('/formations', { params });
    return response.data;
  }

  async getById(id) {
    const response = await api.get(`/formations/${id}`);
    return response.data;
  }

  async getByAdherent(numAdherent) {
    const response = await api.get(`/formations/adherent/${numAdherent}`);
    return response.data;
  }

  async getActive() {
    const response = await api.get('/formations/active');
    return response.data;
  }

  async getWithCompetences(id) {
    const response = await api.get(`/formations/${id}/competences`);
    return response.data;
  }

  async getStats() {
    const response = await api.get('/formations/stats');
    return response.data;
  }

  async create(data) {
    const response = await api.post('/formations', data);
    return response.data;
  }

  async update(id, data) {
    const response = await api.put(`/formations/${id}`, data);
    return response.data;
  }

  async complete(id, data = {}) {
    const response = await api.patch(`/formations/${id}/complete`, data);
    return response.data;
  }

  async ajourner(id, motif) {
    const response = await api.patch(`/formations/${id}/ajourner`, { motif });
    return response.data;
  }

  async enregistrerPaiement(id, data) {
    const response = await api.post(`/formations/${id}/paiement`, data);
    return response.data;
  }

  async delete(id) {
    const response = await api.delete(`/formations/${id}`);
    return response.data;
  }

  async bulkDelete(ids) {
    const response = await api.post("/formations/bulk-delete", { ids });
    return response.data;
  }
}

export default new FormationService();