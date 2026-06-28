const express = require("express");
const router = express.Router();
const PlongeeController = require("../controllers/PlongeeController");
const AuthMiddleware = require("../middlewares/authMiddleware");

const plongeeController = new PlongeeController();

router.get("/", plongeeController.getAll.bind(plongeeController));
router.get("/stats", plongeeController.getStats.bind(plongeeController)); // ✅ Ajouté
router.get(
  "/by-date-range",
  plongeeController.getByDateRange.bind(plongeeController),
);
router.get(
  "/adherent/:num_adherent",
  plongeeController.getByAdherent.bind(plongeeController),
);
router.get("/:id", plongeeController.getById.bind(plongeeController));
router.get(
  "/:id/details",
  plongeeController.getWithDetails.bind(plongeeController),
);

router.post(
  "/",
  AuthMiddleware.authenticate,
  plongeeController.validateBeforeCreate.bind(plongeeController),
  plongeeController.create.bind(plongeeController),
);

router.put(
  "/:id",
  AuthMiddleware.authenticate,
  plongeeController.update.bind(plongeeController),
);

router.patch(
  "/:id/validate",
  AuthMiddleware.authenticate,
  plongeeController.validatePlongee.bind(plongeeController),
);

router.delete(
  "/:id",
  AuthMiddleware.authenticate,
  plongeeController.delete.bind(plongeeController),
);

module.exports = router;
