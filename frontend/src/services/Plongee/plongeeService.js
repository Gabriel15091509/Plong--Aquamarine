import api from '../api';
import { fetchPdfBlobUrl } from '../../utils/downloadFile';

class PlongeeService {
  async getAll(params = {}) {
    const response = await api.get('/plongees', { params });
    return response.data;
  }

  async getById(id) {
    const response = await api.get(`/plongees/${id}`);
    return response.data;
  }

  async getByAdherent(numAdherent) {
    const response = await api.get(`/plongees/adherent/${numAdherent}`);
    return response.data;
  }

  // Aperçu (PdfPreviewModal), jamais un téléchargement direct — c'est
  // désormais le seul flux PDF de toute l'app (voir aussi
  // adhesionService.previewAttestation / paiementService.previewRecu) : un
  // aperçu affiche systématiquement son propre bouton "Télécharger", pas
  // besoin d'une méthode de service à part pour ça.
  async previewCarnet(numAdherent) {
    return fetchPdfBlobUrl(
      `/plongees/adherent/${numAdherent}/carnet-pdf`,
      `carnet-plongee-${numAdherent}.pdf`,
    );
  }

  async previewAttestationSuivi(numAdherent) {
    return fetchPdfBlobUrl(
      `/plongees/adherent/${numAdherent}/attestation-pdf`,
      `attestation-suivi-plongee-${numAdherent}.pdf`,
    );
  }

  async getWithDetails(id) {
    const response = await api.get(`/plongees/${id}/details`);
    return response.data;
  }

  async getStats() {
    const response = await api.get('/plongees/stats');
    return response.data;
  }

  // COUNT léger pour le badge Sidebar — jamais remplacer par getAll()
  // filtré côté client (voir Sidebar.jsx et inscriptionService.
  // getPendingCount, même motif).
  async getAValiderCount() {
    const response = await api.get('/plongees/a-valider-count');
    return response.data;
  }

  async getByDateRange(startDate, endDate) {
    const response = await api.get('/plongees/by-date-range', { 
      params: { startDate, endDate } 
    });
    return response.data;
  }

  async create(data) {
    const response = await api.post('/plongees', data);
    return response.data;
  }

  async update(id, data) {
    const response = await api.put(`/plongees/${id}`, data);
    return response.data;
  }

  async validate(id) {
    const response = await api.patch(`/plongees/${id}/validate`);
    return response.data;
  }

  async delete(id) {
    const response = await api.delete(`/plongees/${id}`);
    return response.data;
  }

  async bulkDelete(ids) {
    const response = await api.post("/plongees/bulk-delete", { ids });
    return response.data;
  }
}

export default new PlongeeService();