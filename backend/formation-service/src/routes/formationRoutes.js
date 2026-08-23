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
// authenticate (et non authorize) : ces 3 routes retournent la fiche
// individuelle d'une formation, potentiellement consultée par l'adhérent
// concerné (contrôle de propriété fait dans FormationService, pas ici) —
// contrairement à "/", "/active", "/stats", "/trend" qui restent sans
// authenticate car appelées en interne sans en-tête (ex: gateway-service
// pour le dashboard, cf. serviceClients/formationClient.js).
router.get(
  "/adherent/:num_adherent",
  AuthMiddleware.authenticate,
  formationController.getByAdherent.bind(formationController),
);
router.get(
  "/:id",
  AuthMiddleware.authenticate,
  formationController.getById.bind(formationController),
);
router.get(
  "/:id/competences",
  AuthMiddleware.authenticate,
  formationController.getWithCompetences.bind(formationController),
);

router.post(
  "/",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_MONITEUR),
  formationController.validateBeforeCreate.bind(formationController),
  formationController.create.bind(formationController),
);

router.put(
  "/:id",
  AuthMiddleware.authenticate,
  formationController.update.bind(formationController),
);

router.patch(
  "/:id/complete",
  AuthMiddleware.authenticate,
  formationController.completeFormation.bind(formationController),
);

router.patch(
  "/:id/ajourner",
  AuthMiddleware.authenticate,
  formationController.ajourner.bind(formationController),
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

// Suppression groupée — même garde que la suppression unitaire ci-dessus
// (authenticate seul : le contrôle "moniteur assigné uniquement" est fait
// dans FormationService.assertCanModifyFormation, pas au niveau route).
router.post(
  "/bulk-delete",
  AuthMiddleware.authenticate,
  formationController.bulkDelete.bind(formationController),
);

module.exports = router;
