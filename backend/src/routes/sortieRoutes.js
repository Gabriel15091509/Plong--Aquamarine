const express = require("express");
const router = express.Router();
const SortieController = require("../controllers/SortieController");
const AuthMiddleware = require("../middlewares/authMiddleware");

const sortieController = new SortieController();

// ✅ Routes authentifiées (nécessaires pour le filtrage par rôle/niveau)
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

// ✅ NOUVELLE ROUTE - Pointage de présence pour une sortie
router.get(
  "/:id/pointage",
  AuthMiddleware.authenticate,
  sortieController.getPointage.bind(sortieController),
);

// ✅ NOUVELLE ROUTE - Enregistrer le pointage
router.post(
  "/:id/pointage",
  AuthMiddleware.authenticate,
  sortieController.enregistrerPointage.bind(sortieController),
);

// ✅ NOUVELLE ROUTE - Modifier un pointage
router.put(
  "/pointage/:id_inscription",
  AuthMiddleware.authenticate,
  sortieController.modifierPointage.bind(sortieController),
);

// ✅ NOUVELLE ROUTE - Annuler un pointage
router.delete(
  "/pointage/:id_inscription",
  AuthMiddleware.authenticate,
  sortieController.annulerPointage.bind(sortieController),
);

// Routes CRUD existantes
router.post(
  "/",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(["president", "moniteur"]),
  sortieController.validateBeforeCreate.bind(sortieController),
  sortieController.create.bind(sortieController),
);

router.put(
  "/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(["president", "moniteur"]),
  sortieController.update.bind(sortieController),
);

router.delete(
  "/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(["president", "moniteur"]),
  sortieController.delete.bind(sortieController),
);

module.exports = router;
