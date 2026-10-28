const express = require("express");
const router = express.Router();
const BrevetController = require("../controllers/BrevetController");
const AuthMiddleware = require("../middlewares/authMiddleware");
const { ROLES } = require("../utils/roleScope");

const brevetController = new BrevetController();

// Historique des niveaux/brevets (voir models/Brevet.js) : président et
// moniteur voient tout le club, un adhérent ne voit que le sien — le scope
// est posé côté BrevetService (getAdherentForUser), jamais ici ; ce garde de
// route n'exclut que les rôles qui n'ont rien à y voir (trésorier).
router.get(
  "/",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize([...ROLES.PRESIDENT_MONITEUR, "adherent"]),
  brevetController.getAll.bind(brevetController),
);

router.get(
  "/adherent/:num_adherent",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize([...ROLES.PRESIDENT_MONITEUR, "adherent"]),
  brevetController.getByAdherent.bind(brevetController),
);

module.exports = router;
