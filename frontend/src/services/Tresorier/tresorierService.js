import api from '../api';

class TresorierService {
  async getAll(params = {}) {
    const response = await api.get('/tresoriers', { params });
    return response.data;
  }

  async getById(id) {
    const response = await api.get(`/tresoriers/${id}`);
    return response.data;
  }

  async getByAnnee(annee) {
    const response = await api.get(`/tresoriers/annee/${annee}`);
    return response.data;
  }

  async getByUserId(userId) {
    const response = await api.get(`/tresoriers/user/${userId}`);
    return response.data;
  }

  async create(data) {
    const response = await api.post('/tresoriers', data);
    return response.data;
  }

  async update(id, data) {
    const response = await api.put(`/tresoriers/${id}`, data);
    return response.data;
  }

  async delete(id) {
    const response = await api.delete(`/tresoriers/${id}`);
    return response.data;
  }
}

export default new TresorierService();
