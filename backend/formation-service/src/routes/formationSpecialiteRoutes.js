const express = require("express");
const router = express.Router();
const FormationSpecialiteController = require("../controllers/FormationSpecialiteController");
const AuthMiddleware = require("../middlewares/authMiddleware");
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
  AuthMiddleware.authorize(ROLES.PRESIDENT_MONITEUR),
  formationSpecialiteController.validateBeforeCreate.bind(formationSpecialiteController),
  formationSpecialiteController.create.bind(formationSpecialiteController),
);

router.put(
  "/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_MONITEUR),
  formationSpecialiteController.update.bind(formationSpecialiteController),
);

router.delete(
  "/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_MONITEUR),
  formationSpecialiteController.delete.bind(formationSpecialiteController),
);

// Suppression groupée — même rôle que la suppression unitaire ci-dessus.
router.post(
  "/bulk-delete",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_MONITEUR),
  formationSpecialiteController.bulkDelete.bind(formationSpecialiteController),
);

module.exports = router;
