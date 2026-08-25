const express = require("express");
const router = express.Router();
const AlerteController = require("../controllers/AlerteController");
const AuthMiddleware = require("../middlewares/authMiddleware");

const alerteController = new AlerteController();

router.get(
  "/",
  AuthMiddleware.authenticate,
  alerteController.getAll.bind(alerteController),
);

router.get(
  "/unread",
  AuthMiddleware.authenticate,
  alerteController.getUnread.bind(alerteController),
);

router.get(
  "/stats",
  AuthMiddleware.authenticate,
  alerteController.getStats.bind(alerteController),
);

router.get(
  "/paginated",
  AuthMiddleware.authenticate,
  alerteController.getAllPaginated.bind(alerteController),
);

router.get(
  "/adherent/:num_adherent",
  AuthMiddleware.authenticate,
  alerteController.getByAdherent.bind(alerteController),
);

router.get(
  "/:id",
  AuthMiddleware.authenticate,
  alerteController.getById.bind(alerteController),
);

router.post(
  "/",
  AuthMiddleware.authenticate,
  alerteController.validateBeforeCreate.bind(alerteController),
  alerteController.create.bind(alerteController),
);

router.patch(
  "/:id/read",
  AuthMiddleware.authenticate,
  alerteController.markAsRead.bind(alerteController),
);

router.post(
  "/:id/relancer",
  AuthMiddleware.authenticate,
  alerteController.relancer.bind(alerteController),
);

router.post(
  "/:id/relancer-sms",
  AuthMiddleware.authenticate,
  alerteController.relancerSms.bind(alerteController),
);

router.patch(
  "/mark-all-read",
  AuthMiddleware.authenticate,
  alerteController.markAllAsRead.bind(alerteController),
);

router.delete(
  "/:id",
  AuthMiddleware.authenticate,
  alerteController.delete.bind(alerteController),
);

module.exports = router;
