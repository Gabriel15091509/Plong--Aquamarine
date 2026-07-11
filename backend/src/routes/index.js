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
const alerteRoutes = require("./alerteRoutes");
const userRoutes = require("./userRoutes");
const emailRoutes = require("./emailRoutes");

// Routes
router.use("/auth", authRoutes);
router.use("/", adherentRoutes); // ✅ adherentRoutes.js définit déjà "/adherents/..."
router.use("/adhesions", adhesionRoutes);
router.use("/certificats-medicaux", certificatMedicalRoutes);
router.use("/paiements", paiementRoutes);
router.use("/sorties", sortieRoutes);
router.use("/inscriptions", inscriptionRoutes);
router.use("/plongees", plongeeRoutes);
router.use("/materiels", materielRoutes);
router.use("/formations", formationRoutes);
router.use("/alertes", alerteRoutes);
router.use("/users", userRoutes);
router.use("/email", emailRoutes);

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
      emails: "/api/emails",
    },
  });
});

module.exports = router;
