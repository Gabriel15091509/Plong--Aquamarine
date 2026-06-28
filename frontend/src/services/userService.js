import api from "./api";

class UserService {
  // ── Récupérer tous les utilisateurs ──────────────────────────
  async getAll(filters = {}) {
    const params = new URLSearchParams();
    if (filters.role && filters.role !== "all")
      params.append("role", filters.role);
    if (filters.status && filters.status !== "all")
      params.append("status", filters.status);
    const response = await api.get(`/users?${params.toString()}`);
    return response.data;
  }

  // ── Créer un utilisateur (président) ─────────────────────────
  async create(data) {
    const response = await api.post("/users", data);
    return response.data;
  }

  // ── Changer le mot de passe (utilisateur connecté) ───────────
  async changePassword(oldPassword, newPassword) {
    const response = await api.post("/auth/change-password", {
      oldPassword,
      newPassword,
    });
    return response.data;
  }

  // ── Profil ────────────────────────────────────────────────────
  async getProfile() {
    const response = await api.get("/users/profile");
    return response.data;
  }

  async updateProfile(data) {
    const response = await api.put("/users/profile", data);
    return response.data;
  }

  // ── Actions admin (président) ─────────────────────────────────
  async resetPassword(userId) {
    const response = await api.post(`/users/${userId}/reset-password`);
    return response.data;
  }

  async changeRole(userId, role) {
    const response = await api.put(`/users/${userId}/role`, { role });
    return response.data;
  }

  async changeNiveau(userId, niveau) {
    const response = await api.put(`/users/${userId}/niveau`, { niveau });
    return response.data;
  }

  async disableAccount(userId) {
    const response = await api.patch(`/users/${userId}/disable`);
    return response.data;
  }

  async enableAccount(userId) {
    const response = await api.patch(`/users/${userId}/enable`);
    return response.data;
  }

  async deleteAccount(userId) {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  }
}

export default new UserService();
