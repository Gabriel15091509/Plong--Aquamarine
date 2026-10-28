const express = require("express");
const router = express.Router();
const BackupController = require("../controllers/BackupController");
const AuthMiddleware = require("../middlewares/authMiddleware");

const backupController = new BackupController();
// Réservé président sans exception (comme "manage_settings" — voir
// authMiddleware.js) : une sauvegarde contient les données personnelles de
// tous les adhérents, et une restauration remplace la base en direct.
const PRESIDENT_ONLY = ["president"];

router.get(
  "/",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(PRESIDENT_ONLY),
  backupController.list.bind(backupController),
);
router.post(
  "/",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(PRESIDENT_ONLY),
  backupController.create.bind(backupController),
);
router.get(
  "/:id/download",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(PRESIDENT_ONLY),
  backupController.download.bind(backupController),
);
router.post(
  "/:id/restore",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(PRESIDENT_ONLY),
  backupController.restore.bind(backupController),
);
router.delete(
  "/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(PRESIDENT_ONLY),
  backupController.delete.bind(backupController),
);

module.exports = router;
