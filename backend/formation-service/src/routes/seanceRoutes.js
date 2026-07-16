const express = require("express");
const router = express.Router();
const SeanceController = require("../controllers/SeanceController");
const AuthMiddleware = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/authorize");
const { ROLES } = require("../utils/roleScope");

const seanceController = new SeanceController();

router.get("/", seanceController.getAll.bind(seanceController));
router.get("/formation/:id_formation", seanceController.getByFormation.bind(seanceController));
router.get(
  "/moniteur/:id_moniteur/encadrement",
  seanceController.getEncadrementByMoniteur.bind(seanceController),
);
router.get(
  "/adherent/:num_adherent/planifiees",
  seanceController.getPlanifieesByAdherent.bind(seanceController),
);
router.get("/:id", seanceController.getById.bind(seanceController));

router.post(
  "/",
  AuthMiddleware.authenticate,
  authorize(ROLES.PRESIDENT_MONITEUR),
  seanceController.validateBeforeCreate.bind(seanceController),
  seanceController.create.bind(seanceController),
);

router.patch(
  "/:id/statut",
  AuthMiddleware.authenticate,
  authorize(ROLES.PRESIDENT_MONITEUR),
  seanceController.updateStatut.bind(seanceController),
);

router.put(
  "/:id",
  AuthMiddleware.authenticate,
  seanceController.update.bind(seanceController),
);

router.delete(
  "/:id",
  AuthMiddleware.authenticate,
  seanceController.delete.bind(seanceController),
);

module.exports = router;
