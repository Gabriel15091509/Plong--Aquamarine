const DashboardService = require("../services/DashboardService");

class DashboardController {
  constructor() {
    this.dashboardService = new DashboardService();
  }

  async getTrends(req, res) {
    try {
      const trends = await this.dashboardService.getTrends();
      res.json({ success: true, data: trends });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = DashboardController;
