// backend/routes/index.js
const express = require("express");
const router = express.Router();
const AdherentController = require("../controllers/AdherentController");
const AuthMiddleware = require("../middlewares/authMiddleware");

const adherentController = new AdherentController();

// ============ ROUTES ADHÉRENTS ============

// Routes publiques
router.get("/adherents", adherentController.getAll.bind(adherentController));
router.get(
  "/adherents/active",
  adherentController.getActiveAdherents.bind(adherentController),
);
router.get(
  "/adherents/expiring-certificates",
  adherentController.getWithExpiringCertificates.bind(adherentController),
);
router.get(
  "/adherents/search",
  adherentController.search.bind(adherentController),
);
router.get(
  "/adherents/stats",
  adherentController.getStats.bind(adherentController),
);
router.get(
  "/adherents/email/:email",
  adherentController.getByEmail.bind(adherentController),
);
router.get(
  "/adherents/niveau/:niveau",
  adherentController.getByNiveau.bind(adherentController),
);
router.get(
  "/adherents/:id",
  adherentController.getById.bind(adherentController),
);
router.get(
  "/adherents/:id/details",
  adherentController.getWithDetails.bind(adherentController),
);

// Routes protégées (nécessitent authentification)
router.post(
  "/adherents",
  AuthMiddleware.authenticate,
  adherentController.validateBeforeCreate.bind(adherentController),
  adherentController.create.bind(adherentController),
);

router.put(
  "/adherents/:id",
  AuthMiddleware.authenticate,
  adherentController.validateBeforeUpdate.bind(adherentController),
  adherentController.update.bind(adherentController),
);

router.patch(
  "/adherents/:id/increment-plongees",
  AuthMiddleware.authenticate,
  adherentController.incrementPlongees.bind(adherentController),
);

router.delete(
  "/adherents/:id",
  AuthMiddleware.authenticate,
  adherentController.delete.bind(adherentController),
);

module.exports = router;
