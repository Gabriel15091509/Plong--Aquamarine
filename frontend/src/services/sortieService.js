import api from "./api";

class SortieService {
  // 📌 Sorties CRUD
  async getAll(params = {}) {
    const response = await api.get("/sorties", { params });
    return response.data;
  }

  async getById(id) {
    const response = await api.get(`/sorties/${id}`);
    return response.data;
  }

  async getUpcoming() {
    const response = await api.get("/sorties/upcoming");
    return response.data;
  }

  async getWithInscriptions() {
    const response = await api.get("/sorties/with-inscriptions");
    return response.data;
  }

  async getAvailablePlaces() {
    const response = await api.get("/sorties/available-places");
    return response.data;
  }

  async getStats() {
    const response = await api.get("/sorties/stats");
    return response.data;
  }

  async getDetails(id) {
    const response = await api.get(`/sorties/${id}/details`);
    return response.data;
  }

  async create(data) {
    const response = await api.post("/sorties", data);
    return response.data;
  }

  async update(id, data) {
    const response = await api.put(`/sorties/${id}`, data);
    return response.data;
  }

  async delete(id) {
    const response = await api.delete(`/sorties/${id}`);
    return response.data;
  }

  // ✅ NOUVEAU - Pointage de présence
  async getPointage(id) {
    const response = await api.get(`/sorties/${id}/pointage`);
    return response.data;
  }

  async enregistrerPointage(id_sortie, inscriptions) {
    const response = await api.post(`/sorties/${id_sortie}/pointage`, {
      inscriptions,
    });
    return response.data;
  }

  async modifierPointage(id_inscription, data) {
    const response = await api.put(`/sorties/pointage/${id_inscription}`, data);
    return response.data;
  }

  async annulerPointage(id_inscription) {
    const response = await api.delete(`/sorties/pointage/${id_inscription}`);
    return response.data;
  }
}

export default new SortieService();
