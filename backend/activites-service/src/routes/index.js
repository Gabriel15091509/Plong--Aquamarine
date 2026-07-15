const express = require("express");
const router = express.Router();

const sortieRoutes = require("./sortieRoutes");
const plongeeRoutes = require("./plongeeRoutes");
const palanqueeRoutes = require("./palanqueeRoutes");
const inscriptionRoutes = require("./inscriptionRoutes");
const attributionRoutes = require("./attributionRoutes");
const incidentRoutes = require("./incidentRoutes");

router.use("/sorties", sortieRoutes);
router.use("/plongees", plongeeRoutes);
router.use("/palanquees", palanqueeRoutes);
router.use("/inscriptions", inscriptionRoutes);
router.use("/attributions", attributionRoutes);
router.use("/incidents", incidentRoutes);

router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "activites-service",
    version: "1.0.0",
    endpoints: {
      sorties: "/api/sorties",
      plongees: "/api/plongees",
      palanquees: "/api/palanquees",
      inscriptions: "/api/inscriptions",
      attributions: "/api/attributions",
      incidents: "/api/incidents",
    },
  });
});

module.exports = router;
