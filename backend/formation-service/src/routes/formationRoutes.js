const express = require("express");
const router = express.Router();
const FormationController = require("../controllers/FormationController");
const AuthMiddleware = require("../middlewares/authMiddleware");
const { ROLES } = require("../utils/roleScope");

const formationController = new FormationController();

router.get("/", formationController.getAll.bind(formationController));
router.get(
  "/active",
  formationController.getActiveFormations.bind(formationController),
);
router.get("/stats", formationController.getStats.bind(formationController));
router.get("/trend", formationController.getTrend.bind(formationController));
router.get(
  "/adherent/:num_adherent",
  formationController.getByAdherent.bind(formationController),
);
router.get("/:id", formationController.getById.bind(formationController));
router.get(
  "/:id/competences",
  formationController.getWithCompetences.bind(formationController),
);

router.post(
  "/",
  AuthMiddleware.authenticate,
  formationController.validateBeforeCreate.bind(formationController),
  formationController.create.bind(formationController),
);

router.put(
  "/:id",
  AuthMiddleware.authenticate,
  formationController.update.bind(formationController),
);

router.patch(
  "/:id/increment-sessions",
  AuthMiddleware.authenticate,
  formationController.incrementSessions.bind(formationController),
);

router.patch(
  "/:id/complete",
  AuthMiddleware.authenticate,
  formationController.completeFormation.bind(formationController),
);

router.post(
  "/:id/paiement",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_TRESORIER),
  formationController.enregistrerPaiement.bind(formationController),
);

router.delete(
  "/:id",
  AuthMiddleware.authenticate,
  formationController.delete.bind(formationController),
);

module.exports = router;
