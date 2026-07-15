const DashboardService = require("../services/DashboardService");
const { withStatus } = require("../utils/errors");

class DashboardController {
  constructor() {
    this.dashboardService = new DashboardService();
  }

  async getTrends(req, res, next) {
    try {
      const trends = await this.dashboardService.getTrends();
      res.json({ success: true, data: trends });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }
}

module.exports = DashboardController;
