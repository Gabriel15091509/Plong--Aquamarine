import api from "../api";
import { downloadFile } from "../../utils/downloadFile";

class PaiementService {
  async getAll(params = {}) {
    const response = await api.get("/paiements", { params });
    return response.data;
  }

  async getById(id) {
    const response = await api.get(`/paiements/${id}`);
    return response.data;
  }

  async getPending() {
    const response = await api.get("/paiements/pending");
    return response.data;
  }

  async getByAdherent(numAdherent) {
    const response = await api.get(`/paiements/adherent/${numAdherent}`);
    return response.data;
  }

  async getStats() {
    const response = await api.get("/paiements/stats");
    return response.data;
  }

  async getTotalByPeriod(startDate, endDate) {
    const response = await api.get("/paiements/total-by-period", {
      params: { startDate, endDate },
    });
    return response.data;
  }

  async create(data) {
    const response = await api.post("/paiements", data);
    return response.data;
  }

  async update(id, data) {
    const response = await api.put(`/paiements/${id}`, data);
    return response.data;
  }

  async process(id) {
    const response = await api.patch(`/paiements/${id}/process`);
    return response.data;
  }

  async cancel(id) {
    const response = await api.patch(`/paiements/${id}/cancel`);
    return response.data;
  }

  async delete(id) {
    const response = await api.delete(`/paiements/${id}`);
    return response.data;
  }

  async downloadRecu(id) {
    return downloadFile(`/paiements/${id}/recu`, `recu-paiement-${id}.pdf`);
  }
}

export default new PaiementService();
