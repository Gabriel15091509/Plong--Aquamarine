const express = require("express");
const router = express.Router();
const FormationSpecialiteController = require("../controllers/FormationSpecialiteController");
const AuthMiddleware = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/authorize");
const { ROLES } = require("../utils/roleScope");

const formationSpecialiteController = new FormationSpecialiteController();

router.get("/", formationSpecialiteController.getAll.bind(formationSpecialiteController));
router.get(
  "/adherent/:num_adherent",
  formationSpecialiteController.getByAdherent.bind(formationSpecialiteController),
);
router.get(
  "/moniteur/:id_moniteur",
  formationSpecialiteController.getByMoniteur.bind(formationSpecialiteController),
);
router.get("/:id", formationSpecialiteController.getById.bind(formationSpecialiteController));

router.post(
  "/",
  AuthMiddleware.authenticate,
  authorize(ROLES.PRESIDENT_MONITEUR),
  formationSpecialiteController.validateBeforeCreate.bind(formationSpecialiteController),
  formationSpecialiteController.create.bind(formationSpecialiteController),
);

router.put(
  "/:id",
  AuthMiddleware.authenticate,
  authorize(ROLES.PRESIDENT_MONITEUR),
  formationSpecialiteController.update.bind(formationSpecialiteController),
);

router.delete(
  "/:id",
  AuthMiddleware.authenticate,
  authorize(ROLES.PRESIDENT_MONITEUR),
  formationSpecialiteController.delete.bind(formationSpecialiteController),
);

module.exports = router;
