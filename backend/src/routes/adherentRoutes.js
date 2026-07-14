// backend/routes/index.js
const express = require("express");
const router = express.Router();
const AdherentController = require("../controllers/AdherentController");
const AuthMiddleware = require("../middlewares/authMiddleware");

const adherentController = new AdherentController();

// ============ ROUTES ADHÉRENTS ============

// Routes authentifiées (nécessaires pour le filtrage par rôle)
router.get(
  "/adherents",
  AuthMiddleware.authenticate,
  adherentController.getAll.bind(adherentController),
);
router.get(
  "/adherents/active",
  AuthMiddleware.authenticate,
  adherentController.getActiveAdherents.bind(adherentController),
);
router.get(
  "/adherents/expiring-certificates",
  AuthMiddleware.authenticate,
  adherentController.getWithExpiringCertificates.bind(adherentController),
);
router.get(
  "/adherents/search",
  AuthMiddleware.authenticate,
  adherentController.search.bind(adherentController),
);
router.get(
  "/adherents/stats",
  AuthMiddleware.authenticate,
  adherentController.getStats.bind(adherentController),
);
router.get(
  "/adherents/email/:email",
  AuthMiddleware.authenticate,
  adherentController.getByEmail.bind(adherentController),
);
router.get(
  "/adherents/niveau/:niveau",
  AuthMiddleware.authenticate,
  adherentController.getByNiveau.bind(adherentController),
);
router.get(
  "/adherents/:id",
  AuthMiddleware.authenticate,
  adherentController.getById.bind(adherentController),
);
router.get(
  "/adherents/:id/details",
  AuthMiddleware.authenticate,
  adherentController.getWithDetails.bind(adherentController),
);

// Routes protégées (réservées au président)
router.post(
  "/adherents",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(["president"]),
  adherentController.validateBeforeCreate.bind(adherentController),
  adherentController.create.bind(adherentController),
);

router.put(
  "/adherents/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(["president"]),
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
  AuthMiddleware.authorize(["president"]),
  adherentController.delete.bind(adherentController),
);

module.exports = router;
