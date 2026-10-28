import api from "../api";

class BackupService {
  async getAll() {
    const response = await api.get("/backups");
    return response.data;
  }

  async create() {
    const response = await api.post("/backups");
    return response.data;
  }

  // Réponse binaire brute (blob), pas le JSON auto-parsé habituel — voir
  // ParametresPage.jsx qui la transforme en URL objet pour déclencher le
  // téléchargement du fichier.
  async download(id) {
    const response = await api.get(`/backups/${id}/download`, {
      responseType: "blob",
    });
    return response.data;
  }

  async restore(id, confirmation) {
    const response = await api.post(`/backups/${id}/restore`, { confirmation });
    return response.data;
  }

  async delete(id) {
    const response = await api.delete(`/backups/${id}`);
    return response.data;
  }
}

export default new BackupService();
