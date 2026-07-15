import api from '../api';

class MoniteurService {
  async getAll(params = {}) {
    const response = await api.get('/moniteurs', { params });
    return response.data;
  }

  async getById(id) {
    const response = await api.get(`/moniteurs/${id}`);
    return response.data;
  }

  async getDisponibles() {
    const response = await api.get('/moniteurs/disponibles');
    return response.data;
  }

  async getBySpecialite(specialite) {
    const response = await api.get(`/moniteurs/specialite/${specialite}`);
    return response.data;
  }

  async getByUserId(userId) {
    const response = await api.get(`/moniteurs/user/${userId}`);
    return response.data;
  }

  async create(data) {
    const response = await api.post('/moniteurs', data);
    return response.data;
  }

  async update(id, data) {
    const response = await api.put(`/moniteurs/${id}`, data);
    return response.data;
  }

  async delete(id) {
    const response = await api.delete(`/moniteurs/${id}`);
    return response.data;
  }
}

export default new MoniteurService();
