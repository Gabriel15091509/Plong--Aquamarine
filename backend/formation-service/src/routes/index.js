const express = require("express");
const router = express.Router();

const formationRoutes = require("./formationRoutes");
const competenceRoutes = require("./competenceRoutes");

router.use("/formations", formationRoutes);
router.use("/competences", competenceRoutes);

router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "formation-service",
    version: "1.0.0",
    endpoints: {
      formations: "/api/formations",
      competences: "/api/competences",
    },
  });
});

module.exports = router;
