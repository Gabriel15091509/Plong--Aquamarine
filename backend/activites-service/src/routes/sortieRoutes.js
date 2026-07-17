const express = require("express");
const router = express.Router();
const SortieController = require("../controllers/SortieController");
const AuthMiddleware = require("../middlewares/authMiddleware");
const { ROLES } = require("../utils/roleScope");

const sortieController = new SortieController();

router.get(
  "/",
  AuthMiddleware.authenticate,
  sortieController.getAll.bind(sortieController),
);
router.get(
  "/upcoming",
  AuthMiddleware.authenticate,
  sortieController.getUpcomingSorties.bind(sortieController),
);
router.get(
  "/with-inscriptions",
  AuthMiddleware.authenticate,
  sortieController.getSortiesWithInscriptions.bind(sortieController),
);
router.get(
  "/available-places",
  AuthMiddleware.authenticate,
  sortieController.getAvailablePlaces.bind(sortieController),
);
router.get("/stats", sortieController.getStats.bind(sortieController));
router.get("/trend", sortieController.getTrend.bind(sortieController));
router.get("/taux-remplissage", sortieController.getTauxRemplissage.bind(sortieController));
router.get(
  "/:id",
  AuthMiddleware.authenticate,
  sortieController.getById.bind(sortieController),
);
router.get(
  "/:id/details",
  AuthMiddleware.authenticate,
  sortieController.getSortieDetails.bind(sortieController),
);

router.get(
  "/:id/pointage",
  AuthMiddleware.authenticate,
  sortieController.getPointage.bind(sortieController),
);

router.post(
  "/:id/pointage",
  AuthMiddleware.authenticate,
  sortieController.enregistrerPointage.bind(sortieController),
);

router.put(
  "/pointage/:id_inscription",
  AuthMiddleware.authenticate,
  sortieController.modifierPointage.bind(sortieController),
);

router.delete(
  "/pointage/:id_inscription",
  AuthMiddleware.authenticate,
  sortieController.annulerPointage.bind(sortieController),
);

router.post(
  "/",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_MONITEUR),
  sortieController.validateBeforeCreate.bind(sortieController),
  sortieController.create.bind(sortieController),
);

router.put(
  "/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_MONITEUR),
  sortieController.update.bind(sortieController),
);

router.delete(
  "/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_MONITEUR),
  sortieController.delete.bind(sortieController),
);

module.exports = router;
