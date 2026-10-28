import api from "../api";

class BrevetService {
  // Président/moniteur : historique complet (tous adhérents). Adhérent : le
  // scope à ses propres brevets est posé côté backend (BrevetService),
  // jamais ici — voir identite-service/src/services/BrevetService.js.
  async getAll(params = {}) {
    const response = await api.get("/brevets", { params });
    return response.data;
  }

  async getByAdherent(num_adherent) {
    const response = await api.get(`/brevets/adherent/${num_adherent}`);
    return response.data;
  }
}

export default new BrevetService();
