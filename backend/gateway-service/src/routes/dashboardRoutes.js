const express = require("express");
const router = express.Router();
const DashboardController = require("../controllers/DashboardController");
const AuthMiddleware = require("../middlewares/authMiddleware");

const dashboardController = new DashboardController();

router.get(
  "/trends",
  AuthMiddleware.authenticate,
  dashboardController.getTrends.bind(dashboardController),
);

router.get(
  "/indicateurs",
  AuthMiddleware.authenticate,
  dashboardController.getIndicateurs.bind(dashboardController),
);

module.exports = router;
