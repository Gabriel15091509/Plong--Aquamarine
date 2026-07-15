import api from '../api';

class AlerteService {
  async getAll(params = {}) {
    const response = await api.get('/alertes', { params });
    return response.data;
  }

  async getById(id) {
    const response = await api.get(`/alertes/${id}`);
    return response.data;
  }

  async getByAdherent(numAdherent) {
    const response = await api.get(`/alertes/adherent/${numAdherent}`);
    return response.data;
  }

  async getUnread() {
    const response = await api.get('/alertes/unread');
    return response.data;
  }

  async create(data) {
    const response = await api.post('/alertes', data);
    return response.data;
  }

  async markAsRead(id) {
    const response = await api.patch(`/alertes/${id}/read`);
    return response.data;
  }

  async markAllAsRead() {
    const response = await api.patch('/alertes/mark-all-read');
    return response.data;
  }

  async delete(id) {
    const response = await api.delete(`/alertes/${id}`);
    return response.data;
  }
}

export default new AlerteService();