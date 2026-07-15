const express = require("express");
const router = express.Router();

const authRoutes = require("./authRoutes");
const adherentRoutes = require("./adherentRoutes");
const userRoutes = require("./userRoutes");
const moniteurRoutes = require("./moniteurRoutes");
const presidentRoutes = require("./presidentRoutes");
const tresorierRoutes = require("./tresorierRoutes");
const emailRoutes = require("./emailRoutes");

router.use("/auth", authRoutes);
router.use("/", adherentRoutes); // adherentRoutes.js définit déjà "/adherents/..."
router.use("/users", userRoutes);
router.use("/moniteurs", moniteurRoutes);
router.use("/president", presidentRoutes);
router.use("/tresoriers", tresorierRoutes);
router.use("/email", emailRoutes);

router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "identite-service",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      adherents: "/api/adherents",
      users: "/api/users",
      moniteurs: "/api/moniteurs",
      president: "/api/president",
      tresoriers: "/api/tresoriers",
      email: "/api/email",
    },
  });
});

module.exports = router;
