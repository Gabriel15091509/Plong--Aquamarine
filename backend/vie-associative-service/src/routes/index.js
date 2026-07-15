const express = require("express");
const router = express.Router();

const adhesionRoutes = require("./adhesionRoutes");
const certificatMedicalRoutes = require("./certificatMedicalRoutes");
const alerteRoutes = require("./alerteRoutes");

router.use("/adhesions", adhesionRoutes);
router.use("/certificats-medicaux", certificatMedicalRoutes);
router.use("/alertes", alerteRoutes);

router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "vie-associative-service",
    version: "1.0.0",
    endpoints: {
      adhesions: "/api/adhesions",
      certificats_medicaux: "/api/certificats-medicaux",
      alertes: "/api/alertes",
    },
  });
});

module.exports = router;
