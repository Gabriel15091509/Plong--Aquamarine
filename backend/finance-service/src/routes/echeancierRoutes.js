const express = require("express");
const router = express.Router();
const EcheancierController = require("../controllers/EcheancierController");
const AuthMiddleware = require("../middlewares/authMiddleware");
const { ROLES } = require("../utils/roleScope");

const echeancierController = new EcheancierController();

router.get("/", AuthMiddleware.authenticate, echeancierController.getByReference.bind(echeancierController));
router.get(
  "/adherent/:num_adherent",
  AuthMiddleware.authenticate,
  echeancierController.getByAdherent.bind(echeancierController),
);

router.post(
  "/",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_TRESORIER),
  echeancierController.create.bind(echeancierController),
);

router.post(
  "/echeances/:id/paiement",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_TRESORIER),
  echeancierController.payerEcheance.bind(echeancierController),
);

module.exports = router;
