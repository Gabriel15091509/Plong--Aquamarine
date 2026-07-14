import api from './api';

class CompetenceService {
  async getAll(params = {}) {
    const response = await api.get('/competences', { params });
    return response.data;
  }

  async getById(id) {
    const response = await api.get(`/competences/${id}`);
    return response.data;
  }

  async getByFormation(idFormation) {
    const response = await api.get(`/competences/formation/${idFormation}`);
    return response.data;
  }

  async create(data) {
    const response = await api.post('/competences', data);
    return response.data;
  }

  async valider(id, data) {
    const response = await api.patch(`/competences/${id}/valider`, data);
    return response.data;
  }

  async update(id, data) {
    const response = await api.put(`/competences/${id}`, data);
    return response.data;
  }

  async delete(id) {
    const response = await api.delete(`/competences/${id}`);
    return response.data;
  }
}

export default new CompetenceService();
