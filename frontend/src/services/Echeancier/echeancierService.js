import api from "../api";

class EcheancierService {
  async create(data) {
    const response = await api.post("/echeanciers", data);
    return response.data;
  }

  async getByReference(type_paiement, reference_id) {
    const response = await api.get("/echeanciers", {
      params: { type_paiement, reference_id },
    });
    return response.data;
  }

  async getByAdherent(numAdherent) {
    const response = await api.get(`/echeanciers/adherent/${numAdherent}`);
    return response.data;
  }

  async payerEcheance(id_echeance, data) {
    const response = await api.post(`/echeanciers/echeances/${id_echeance}/paiement`, data);
    return response.data;
  }
}

export default new EcheancierService();
