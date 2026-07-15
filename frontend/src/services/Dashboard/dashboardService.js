import api from "../api";

class DashboardService {
  async getTrends() {
    const response = await api.get("/dashboard/trends");
    return response.data;
  }
}

export default new DashboardService();
