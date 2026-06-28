const express = require("express");
const router = express.Router();

// Import des routes
const authRoutes = require("./authRoutes");
const adherentRoutes = require("./adherentRoutes");
const adhesionRoutes = require("./adhesionRoutes");
const certificatMedicalRoutes = require("./certificatMedicalRoutes");
const paiementRoutes = require("./paiementRoutes");
const sortieRoutes = require("./sortieRoutes");
const inscriptionRoutes = require("./inscriptionRoutes");
const plongeeRoutes = require("./plongeeRoutes");
const materielRoutes = require("./materielRoutes");
const formationRoutes = require("./formationRoutes");
const alerteRoutes = require("./alerteRoutes"); // ✅ Vérifier que l'import existe

// Routes
router.use("/auth", authRoutes);
router.use("/adherents", adherentRoutes);
router.use("/adhesions", adhesionRoutes);
router.use("/certificats-medicaux", certificatMedicalRoutes);
router.use("/paiements", paiementRoutes);
router.use("/sorties", sortieRoutes);
router.use("/inscriptions", inscriptionRoutes);
router.use("/plongees", plongeeRoutes);
router.use("/materiels", materielRoutes);
router.use("/formations", formationRoutes);
router.use("/alertes", alerteRoutes); // ✅ Vérifier que la route existe

// Route racine API
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API Plongée Club",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      adherents: "/api/adherents",
      adhesions: "/api/adhesions",
      certificats_medicaux: "/api/certificats-medicaux",
      paiements: "/api/paiements",
      sorties: "/api/sorties",
      inscriptions: "/api/inscriptions",
      plongees: "/api/plongees",
      materiels: "/api/materiels",
      formations: "/api/formations",
      alertes: "/api/alertes",
    },
  });
});

module.exports = router;
