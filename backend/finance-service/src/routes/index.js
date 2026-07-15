const express = require("express");
const router = express.Router();

const paiementRoutes = require("./paiementRoutes");

router.use("/paiements", paiementRoutes);

router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "finance-service",
    version: "1.0.0",
    endpoints: {
      paiements: "/api/paiements",
    },
  });
});

module.exports = router;
