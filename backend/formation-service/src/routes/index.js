const express = require("express");
const router = express.Router();

const formationRoutes = require("./formationRoutes");
const competenceRoutes = require("./competenceRoutes");
const seanceRoutes = require("./seanceRoutes");
const formationSpecialiteRoutes = require("./formationSpecialiteRoutes");

router.use("/formations", formationRoutes);
router.use("/competences", competenceRoutes);
router.use("/seances", seanceRoutes);
router.use("/specialites-formation", formationSpecialiteRoutes);

router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "formation-service",
    version: "1.0.0",
    endpoints: {
      formations: "/api/formations",
      competences: "/api/competences",
      seances: "/api/seances",
      specialitesFormation: "/api/specialites-formation",
    },
  });
});

module.exports = router;
