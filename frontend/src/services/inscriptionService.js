import api from './api';

class InscriptionService {
  async getAll(params = {}) {
    const response = await api.get('/inscriptions', { params });
    return response.data;
  }

  async getById(id) {
    const response = await api.get(`/inscriptions/${id}`);
    return response.data;
  }

  async getBySortie(sortieId) {
    const response = await api.get(`/inscriptions/sortie/${sortieId}`);
    return response.data;
  }

  async getWaitlist(sortieId) {
    const response = await api.get(`/inscriptions/sortie/${sortieId}/waitlist`);
    return response.data;
  }

  async getByAdherentAndSortie(adherentId, sortieId) {
    const response = await api.get(`/inscriptions/adherent/${adherentId}/sortie/${sortieId}`);
    return response.data;
  }

  async getStats() {
    const response = await api.get('/inscriptions/stats');
    return response.data;
  }

  async create(data) {
    const response = await api.post('/inscriptions', data);
    return response.data;
  }

  async confirm(id) {
    const response = await api.patch(`/inscriptions/${id}/confirm`);
    return response.data;
  }

  async cancel(id) {
    const response = await api.patch(`/inscriptions/${id}/cancel`);
    return response.data;
  }

  async delete(id) {
    const response = await api.delete(`/inscriptions/${id}`);
    return response.data;
  }
}

export default new InscriptionService();