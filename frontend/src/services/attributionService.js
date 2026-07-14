import api from './api';

class AttributionService {
  async getAll(params = {}) {
    const response = await api.get('/attributions', { params });
    return response.data;
  }

  async getById(id) {
    const response = await api.get(`/attributions/${id}`);
    return response.data;
  }

  async getEnCours() {
    const response = await api.get('/attributions/en-cours');
    return response.data;
  }

  async getByAdherent(numAdherent) {
    const response = await api.get(`/attributions/adherent/${numAdherent}`);
    return response.data;
  }

  async getByMateriel(numInventaire) {
    const response = await api.get(`/attributions/materiel/${numInventaire}`);
    return response.data;
  }

  async getByPalanquee(idPalanquee) {
    const response = await api.get(`/attributions/palanquee/${idPalanquee}`);
    return response.data;
  }

  async create(data) {
    const response = await api.post('/attributions', data);
    return response.data;
  }

  async retour(id, data) {
    const response = await api.patch(`/attributions/${id}/retour`, data);
    return response.data;
  }

  async update(id, data) {
    const response = await api.put(`/attributions/${id}`, data);
    return response.data;
  }

  async delete(id) {
    const response = await api.delete(`/attributions/${id}`);
    return response.data;
  }

  async enregistrerCaution(id, data) {
    const response = await api.post(`/attributions/${id}/caution`, data);
    return response.data;
  }

  async restituerCaution(id) {
    const response = await api.post(`/attributions/${id}/restituer-caution`);
    return response.data;
  }

  async traiterDeterioration(id, data) {
    const response = await api.post(`/attributions/${id}/deterioration`, data);
    return response.data;
  }
}

export default new AttributionService();
