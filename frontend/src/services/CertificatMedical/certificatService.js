import api from '../api';

class CertificatService {
  async getAll(params = {}) {
    const response = await api.get('/certificats-medicaux', { params });
    return response.data;
  }

  async getById(id) {
    const response = await api.get(`/certificats-medicaux/${id}`);
    return response.data;
  }

  async getValid() {
    const response = await api.get('/certificats-medicaux/valid');
    return response.data;
  }

  async getExpired() {
    const response = await api.get('/certificats-medicaux/expired');
    return response.data;
  }

  async getByAdherent(numAdherent) {
    const response = await api.get(`/certificats-medicaux/adherent/${numAdherent}`);
    return response.data;
  }

  async getStatus(numAdherent) {
    const response = await api.get(`/certificats-medicaux/adherent/${numAdherent}/status`);
    return response.data;
  }

  async create(data) {
    const isFormData = data instanceof FormData;
    const response = await api.post('/certificats-medicaux', data, isFormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : undefined);
    return response.data;
  }

  async update(id, data) {
    const isFormData = data instanceof FormData;
    const response = await api.put(`/certificats-medicaux/${id}`, data, isFormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : undefined);
    return response.data;
  }

  async delete(id) {
    const response = await api.delete(`/certificats-medicaux/${id}`);
    return response.data;
  }

  async valider(id, { decision, motif }) {
    const response = await api.post(`/certificats-medicaux/${id}/valider`, { decision, motif });
    return response.data;
  }

  async analysePhoto({ photoFile, num_adherent, medecin, date_validite, date_delivrance }) {
    const payload = new FormData();
    payload.append('photo', photoFile);
    payload.append('num_adherent', num_adherent);
    payload.append('medecin', medecin);
    if (date_validite) payload.append('date_validite', date_validite);
    if (date_delivrance) payload.append('date_delivrance', date_delivrance);
    const response = await api.post('/certificats-medicaux/analyser-photo', payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }
}

export default new CertificatService();