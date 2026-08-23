const express = require("express");
const router = express.Router();
const MaterielController = require("../controllers/MaterielController");
const AuthMiddleware = require("../middlewares/authMiddleware");
const { uploadMaterielPhoto } = require("../middlewares/upload");

const materielController = new MaterielController();

router.get("/", materielController.getAll.bind(materielController));
router.get(
  "/available",
  materielController.getAvailableMateriel.bind(materielController),
);
router.get(
  "/needing-maintenance",
  materielController.getNeedingMaintenance.bind(materielController),
);
router.get(
  "/with-reparations",
  materielController.getWithReparations.bind(materielController),
);
router.get("/stats", materielController.getStats.bind(materielController));
router.get("/trend", materielController.getTrend.bind(materielController));
router.get(
  "/:num_inventaire",
  materielController.getById.bind(materielController),
);
router.get(
  "/:num_inventaire/availability",
  materielController.checkAvailability.bind(materielController),
);

router.post(
  "/",
  AuthMiddleware.authenticate,
  materielController.validateBeforeCreate.bind(materielController),
  materielController.create.bind(materielController),
);

router.put(
  "/:num_inventaire",
  AuthMiddleware.authenticate,
  materielController.update.bind(materielController),
);

router.patch(
  "/:num_inventaire/etat",
  AuthMiddleware.authenticate,
  materielController.updateEtat.bind(materielController),
);

router.patch(
  "/:num_inventaire/localisation",
  AuthMiddleware.authenticate,
  materielController.updateLocalisation.bind(materielController),
);

router.put(
  "/:num_inventaire/photo",
  AuthMiddleware.authenticate,
  ...uploadMaterielPhoto,
  materielController.updatePhoto.bind(materielController),
);

router.delete(
  "/:num_inventaire",
  AuthMiddleware.authenticate,
  materielController.delete.bind(materielController),
);

// Suppression groupée — même garde que la suppression unitaire ci-dessus.
router.post(
  "/bulk-delete",
  AuthMiddleware.authenticate,
  materielController.bulkDelete.bind(materielController),
);

module.exports = router;
