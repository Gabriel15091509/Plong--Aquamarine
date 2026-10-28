import api from "../api";

class InscriptionService {
  async getAll() {
    const response = await api.get("/inscriptions");
    return response.data;
  }

  async getById(id) {
    const response = await api.get(`/inscriptions/${id}`);
    return response.data;
  }

  // Compteur "En attente" (badge Sidebar.jsx) — voir useInscriptions.
  // useGetPendingCount : un COUNT léger, à ne jamais remplacer par getAll()
  // filtré côté client (celui-ci recompose `.adherent` par HTTP pour
  // chaque inscription, bien trop coûteux pour n'en garder qu'un chiffre).
  async getPendingCount() {
    const response = await api.get("/inscriptions/pending-count");
    return response.data;
  }

  async create(data) {
    const response = await api.post("/inscriptions", data);
    return response.data;
  }

  async update(id, data) {
    const response = await api.put(`/inscriptions/${id}`, data);
    return response.data;
  }

  async delete(id) {
    const response = await api.delete(`/inscriptions/${id}`);
    return response.data;
  }

  async bulkDelete(ids) {
    const response = await api.post("/inscriptions/bulk-delete", { ids });
    return response.data;
  }

  async confirm(id) {
    const response = await api.patch(`/inscriptions/${id}/confirm`);
    return response.data;
  }

  async cancel(id) {
    const response = await api.patch(`/inscriptions/${id}/cancel`);
    return response.data;
  }

  async getConfirmationsBySortie(id_sortie) {
    const response = await api.get(`/inscriptions/sortie/${id_sortie}`);
    return response.data;
  }

  async getPresentsBySortie(id_sortie) {
    const response = await api.get(`/inscriptions/sortie/${id_sortie}`, {
      params: { presents: "true" },
    });
    return response.data;
  }

  async getWaitlistBySortie(id_sortie) {
    const response = await api.get(
      `/inscriptions/sortie/${id_sortie}/waitlist`,
    );
    return response.data;
  }

  async getCapacityBySortie(id_sortie) {
    const response = await api.get(
      `/inscriptions/sortie/${id_sortie}/capacity`,
    );
    return response.data;
  }

  async getStats() {
    const response = await api.get("/inscriptions/stats");
    return response.data;
  }

  async getByAdherent(num_adherent) {
    const response = await api.get(`/inscriptions/adherent/${num_adherent}`);
    return response.data;
  }

  async getByAdherentAndSortie(num_adherent, id_sortie) {
    const response = await api.get(
      `/inscriptions/adherent/${num_adherent}/sortie/${id_sortie}`,
    );
    return response.data;
  }

  async enregistrerPaiement(id, data) {
    const response = await api.post(`/inscriptions/${id}/paiement`, data);
    return response.data;
  }

}

export default new InscriptionService();
