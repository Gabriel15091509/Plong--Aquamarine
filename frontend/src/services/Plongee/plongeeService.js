import api from '../api';

class PlongeeService {
  async getAll(params = {}) {
    const response = await api.get('/plongees', { params });
    return response.data;
  }

  async getById(id) {
    const response = await api.get(`/plongees/${id}`);
    return response.data;
  }

  async getByAdherent(numAdherent) {
    const response = await api.get(`/plongees/adherent/${numAdherent}`);
    return response.data;
  }

  async getWithDetails(id) {
    const response = await api.get(`/plongees/${id}/details`);
    return response.data;
  }

  async getStats() {
    const response = await api.get('/plongees/stats');
    return response.data;
  }

  async getByDateRange(startDate, endDate) {
    const response = await api.get('/plongees/by-date-range', { 
      params: { startDate, endDate } 
    });
    return response.data;
  }

  async create(data) {
    const response = await api.post('/plongees', data);
    return response.data;
  }

  async update(id, data) {
    const response = await api.put(`/plongees/${id}`, data);
    return response.data;
  }

  async validate(id) {
    const response = await api.patch(`/plongees/${id}/validate`);
    return response.data;
  }

  async delete(id) {
    const response = await api.delete(`/plongees/${id}`);
    return response.data;
  }
}

export default new PlongeeService();