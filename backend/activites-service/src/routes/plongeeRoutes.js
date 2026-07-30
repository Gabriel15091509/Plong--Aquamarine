const express = require("express");
const router = express.Router();
const PlongeeController = require("../controllers/PlongeeController");
const AuthMiddleware = require("../middlewares/authMiddleware");
const { ROLES } = require("../utils/roleScope");

const plongeeController = new PlongeeController();

router.get(
  "/",
  AuthMiddleware.authenticate,
  plongeeController.getAll.bind(plongeeController),
);
router.get("/stats", plongeeController.getStats.bind(plongeeController));
router.get(
  "/inactifs/count",
  AuthMiddleware.authenticate,
  plongeeController.getNbInactifs.bind(plongeeController),
);
router.get("/trend", plongeeController.getTrend.bind(plongeeController));
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
  "/adherent/:num_adherent/carnet-pdf",
  AuthMiddleware.authenticate,
  plongeeController.getCarnetPdf.bind(plongeeController),
);
router.get(
  "/adherent/:num_adherent/attestation-pdf",
  AuthMiddleware.authenticate,
  plongeeController.getAttestationSuiviPdf.bind(plongeeController),
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
  AuthMiddleware.authorize(ROLES.PRESIDENT_MONITEUR),
  plongeeController.validateBeforeCreate.bind(plongeeController),
  plongeeController.create.bind(plongeeController),
);

router.put(
  "/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_MONITEUR),
  plongeeController.update.bind(plongeeController),
);

router.patch(
  "/:id/validate",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_MONITEUR),
  plongeeController.validatePlongee.bind(plongeeController),
);

router.delete(
  "/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_MONITEUR),
  plongeeController.delete.bind(plongeeController),
);

module.exports = router;
