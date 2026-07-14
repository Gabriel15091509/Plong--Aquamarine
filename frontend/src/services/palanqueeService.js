import api from './api';

class PalanqueeService {
  async getAll(params = {}) {
    const response = await api.get('/palanquees', { params });
    return response.data;
  }

  async getById(id) {
    const response = await api.get(`/palanquees/${id}`);
    return response.data;
  }

  async getByPlongee(idPlongee) {
    const response = await api.get(`/palanquees/plongee/${idPlongee}`);
    return response.data;
  }

  async getBySortie(idSortie) {
    const response = await api.get(`/palanquees/sortie/${idSortie}`);
    return response.data;
  }

  async getStatsBySortie(idSortie) {
    const response = await api.get(`/palanquees/sortie/${idSortie}/stats`);
    return response.data;
  }

  async getByMoniteur(idMoniteur) {
    const response = await api.get(`/palanquees/moniteur/${idMoniteur}`);
    return response.data;
  }

  async create(data) {
    const response = await api.post('/palanquees', data);
    return response.data;
  }

  async addMembre(id, numAdherent) {
    const response = await api.post(`/palanquees/${id}/membres`, {
      num_adherent: numAdherent,
    });
    return response.data;
  }

  async removeMembre(id, numAdherent) {
    const response = await api.delete(
      `/palanquees/${id}/membres/${numAdherent}`,
    );
    return response.data;
  }

  async updateEncadrement(id, data) {
    const response = await api.patch(`/palanquees/${id}/encadrement`, data);
    return response.data;
  }

  async enregistrerDonneesPlongee(id, data) {
    const response = await api.post(`/palanquees/${id}/plongee`, data);
    return response.data;
  }

  async retournerMateriel(id, retours) {
    const response = await api.patch(`/palanquees/${id}/retour-materiel`, {
      retours,
    });
    return response.data;
  }

  async cloturer(id) {
    const response = await api.patch(`/palanquees/${id}/cloturer`);
    return response.data;
  }

  async update(id, data) {
    const response = await api.put(`/palanquees/${id}`, data);
    return response.data;
  }

  async delete(id) {
    const response = await api.delete(`/palanquees/${id}`);
    return response.data;
  }
}

export default new PalanqueeService();
