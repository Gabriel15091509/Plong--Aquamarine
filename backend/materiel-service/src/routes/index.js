const express = require("express");
const router = express.Router();

const materielRoutes = require("./materielRoutes");
const reparationRoutes = require("./reparationRoutes");

router.use("/materiels", materielRoutes);
router.use("/reparations", reparationRoutes);

router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "materiel-service",
    version: "1.0.0",
    endpoints: {
      materiels: "/api/materiels",
      reparations: "/api/reparations",
    },
  });
});

module.exports = router;
