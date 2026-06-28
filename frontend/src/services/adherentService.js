import api from "./api";

class AdherentService {
  async getAll(params = {}) {
    const response = await api.get("/adherents", { params });
    return response.data;
  }

  async getById(id) {
    const response = await api.get(`/adherents/${id}`);
    return response.data;
  }

  async getWithDetails(id) {
    const response = await api.get(`/adherents/${id}/details`);
    return response.data;
  }

  async getActive() {
    const response = await api.get("/adherents/active");
    return response.data;
  }

  async getStats() {
    const response = await api.get("/adherents/stats");
    return response.data;
  }

  async search(query) {
    const response = await api.get("/adherents/search", {
      params: { q: query },
    });
    return response.data;
  }

  async create(data) {
    const response = await api.post("/adherents", data);
    return response.data;
  }

  async update(id, data) {
    const response = await api.put(`/adherents/${id}`, data);
    return response.data;
  }

  async delete(id) {
    const response = await api.delete(`/adherents/${id}`);
    return response.data;
  }

  async incrementPlongees(id) {
    const response = await api.patch(`/adherents/${id}/increment-plongees`);
    return response.data;
  }
}

export default new AdherentService();
