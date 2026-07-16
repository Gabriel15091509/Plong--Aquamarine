import api from '../api';

class SeanceService {
  async getByFormation(idFormation) {
    const response = await api.get(`/seances/formation/${idFormation}`);
    return response.data;
  }

  async getById(id) {
    const response = await api.get(`/seances/${id}`);
    return response.data;
  }

  async getPlanifieesByAdherent(numAdherent) {
    const response = await api.get(`/seances/adherent/${numAdherent}/planifiees`);
    return response.data;
  }

  async create(data) {
    const response = await api.post('/seances', data);
    return response.data;
  }

  async updateStatut(id, data) {
    const response = await api.patch(`/seances/${id}/statut`, data);
    return response.data;
  }

  async delete(id) {
    const response = await api.delete(`/seances/${id}`);
    return response.data;
  }

  async getEncadrementByMoniteur(idMoniteur) {
    const response = await api.get(`/seances/moniteur/${idMoniteur}/encadrement`);
    return response.data;
  }
}

export default new SeanceService();
