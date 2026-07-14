const express = require("express");
const router = express.Router();
const PlongeeController = require("../controllers/PlongeeController");
const AuthMiddleware = require("../middlewares/authMiddleware");

const plongeeController = new PlongeeController();

router.get(
  "/",
  AuthMiddleware.authenticate,
  plongeeController.getAll.bind(plongeeController),
);
router.get("/stats", plongeeController.getStats.bind(plongeeController)); // ✅ Ajouté
router.get(
  "/by-date-range",
  plongeeController.getByDateRange.bind(plongeeController),
);
router.get(
  "/adherent/:num_adherent",
  AuthMiddleware.authenticate,
  plongeeController.getByAdherent.bind(plongeeController),
);
router.get(
  "/:id",
  AuthMiddleware.authenticate,
  plongeeController.getById.bind(plongeeController),
);
router.get(
  "/:id/details",
  AuthMiddleware.authenticate,
  plongeeController.getWithDetails.bind(plongeeController),
);

router.post(
  "/",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(["president", "moniteur"]),
  plongeeController.validateBeforeCreate.bind(plongeeController),
  plongeeController.create.bind(plongeeController),
);

router.put(
  "/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(["president", "moniteur"]),
  plongeeController.update.bind(plongeeController),
);

router.patch(
  "/:id/validate",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(["president", "moniteur"]),
  plongeeController.validatePlongee.bind(plongeeController),
);

router.delete(
  "/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(["president", "moniteur"]),
  plongeeController.delete.bind(plongeeController),
);

module.exports = router;
