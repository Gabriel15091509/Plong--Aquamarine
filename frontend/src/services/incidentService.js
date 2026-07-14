import api from './api';

class IncidentService {
  async getAll(params = {}) {
    const response = await api.get('/incidents', { params });
    return response.data;
  }

  async getById(id) {
    const response = await api.get(`/incidents/${id}`);
    return response.data;
  }

  async getNonClotures() {
    const response = await api.get('/incidents/non-clotures');
    return response.data;
  }

  async getBySortie(idSortie) {
    const response = await api.get(`/incidents/sortie/${idSortie}`);
    return response.data;
  }

  async create(data) {
    const response = await api.post('/incidents', data);
    return response.data;
  }

  async cloturer(id, data = {}) {
    const response = await api.patch(`/incidents/${id}/cloturer`, data);
    return response.data;
  }

  async update(id, data) {
    const response = await api.put(`/incidents/${id}`, data);
    return response.data;
  }

  async delete(id) {
    const response = await api.delete(`/incidents/${id}`);
    return response.data;
  }
}

export default new IncidentService();
