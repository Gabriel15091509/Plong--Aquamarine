const express = require("express");
const router = express.Router();
const AdherentController = require("../controllers/AdherentController");
const AuthMiddleware = require("../middlewares/authMiddleware");
const { ROLES } = require("../utils/roleScope");

const adherentController = new AdherentController();

// ============ ROUTES ADHÉRENTS ============

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
// Publique (pas d'AuthMiddleware) : endpoint interne inter-services, même
// contrat que `GET /tresoriers/user/:user_id` — appelé par
// finance-service/vie-associative-service (identiteClient).
router.get(
  "/adherents/user/:user_id",
  adherentController.getByUserId.bind(adherentController),
);
// Publique : utilisé par DashboardService (monolithe) à la place d'une
// requête Sequelize directe sur le modèle Adherent, qui n'appartient plus
// au monolithe — même contrat que `GET /formations/trend`.
router.get(
  "/adherents/trend",
  adherentController.getTrend.bind(adherentController),
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

router.post(
  "/adherents",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_ONLY),
  adherentController.validateBeforeCreate.bind(adherentController),
  adherentController.create.bind(adherentController),
);

router.put(
  "/adherents/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_ONLY),
  adherentController.validateBeforeUpdate.bind(adherentController),
  adherentController.update.bind(adherentController),
);

router.patch(
  "/adherents/:id/increment-plongees",
  AuthMiddleware.authenticate,
  adherentController.incrementPlongees.bind(adherentController),
);

router.patch(
  "/adherents/:id/niveau",
  AuthMiddleware.authenticate,
  adherentController.updateNiveau.bind(adherentController),
);

router.delete(
  "/adherents/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_ONLY),
  adherentController.delete.bind(adherentController),
);

module.exports = router;
