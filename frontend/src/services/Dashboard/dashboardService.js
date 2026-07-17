import api from "../api";

class DashboardService {
  async getTrends() {
    const response = await api.get("/dashboard/trends");
    return response.data;
  }

  async getIndicateurs() {
    const response = await api.get("/dashboard/indicateurs");
    return response.data;
  }
}

export default new DashboardService();
