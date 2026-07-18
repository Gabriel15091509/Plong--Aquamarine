const express = require("express");
const router = express.Router();

const paiementRoutes = require("./paiementRoutes");
const echeancierRoutes = require("./echeancierRoutes");

router.use("/paiements", paiementRoutes);
router.use("/echeanciers", echeancierRoutes);

router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "finance-service",
    version: "1.0.0",
    endpoints: {
      paiements: "/api/paiements",
      echeanciers: "/api/echeanciers",
    },
  });
});

module.exports = router;
