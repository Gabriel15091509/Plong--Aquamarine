import api from './api';

class PresidentService {
  async getAll(params = {}) {
    const response = await api.get('/president', { params });
    return response.data;
  }

  async getById(id) {
    const response = await api.get(`/president/${id}`);
    return response.data;
  }

  async getCurrent() {
    const response = await api.get('/president/current');
    return response.data;
  }

  async getByAnnee(annee) {
    const response = await api.get(`/president/annee/${annee}`);
    return response.data;
  }

  async create(data) {
    const response = await api.post('/president', data);
    return response.data;
  }

  async update(id, data) {
    const response = await api.put(`/president/${id}`, data);
    return response.data;
  }

  async delete(id) {
    const response = await api.delete(`/president/${id}`);
    return response.data;
  }
}

export default new PresidentService();
