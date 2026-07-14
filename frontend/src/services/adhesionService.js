import api from './api';
import { downloadFile } from '../utils/downloadFile';

class AdhesionService {
  async getAll(params = {}) {
    const response = await api.get('/adhesions', { params });
    return response.data;
  }

  async getById(id) {
    const response = await api.get(`/adhesions/${id}`);
    return response.data;
  }

  async getActive() {
    const response = await api.get('/adhesions/active');
    return response.data;
  }

  async getExpiring(days = 30) {
    const response = await api.get('/adhesions/expiring', { params: { days } });
    return response.data;
  }

  async getByAdherent(numAdherent) {
    const response = await api.get(`/adhesions/adherent/${numAdherent}`);
    return response.data;
  }

  async getStats() {
    const response = await api.get('/adhesions/stats');
    return response.data;
  }

  async create(data) {
    const isFormData = data instanceof FormData;
    const response = await api.post('/adhesions', data, isFormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : undefined);
    return response.data;
  }

  async update(id, data) {
    const isFormData = data instanceof FormData;
    const response = await api.put(`/adhesions/${id}`, data, isFormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : undefined);
    return response.data;
  }

  async getDossierStatus(numAdherent) {
    const response = await api.get(`/adhesions/adherent/${numAdherent}/dossier-status`);
    return response.data;
  }

  async enregistrerPaiement(id, data) {
    const response = await api.post(`/adhesions/${id}/paiement`, data);
    return response.data;
  }

  async downloadAttestation(numAdherent, annee) {
    return downloadFile(
      `/adhesions/adherent/${numAdherent}/attestation?annee=${annee}`,
      `attestation-adhesion-${numAdherent}-${annee}.pdf`,
    );
  }

  async delete(id) {
    const response = await api.delete(`/adhesions/${id}`);
    return response.data;
  }
}

export default new AdhesionService();