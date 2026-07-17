const express = require("express");
const router = express.Router();
const UserController = require("../controllers/UserController");
const AuthMiddleware = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/authorize");
const { uploadUserPhoto } = require("../middlewares/upload");

const userController = new UserController();

router.put(
  "/profile",
  AuthMiddleware.authenticate,
  ...uploadUserPhoto,
  userController.updateProfile.bind(userController),
);

router.post(
  "/change-password",
  AuthMiddleware.authenticate,
  userController.changePassword.bind(userController),
);

router.get(
  "/check-permission/:permission",
  AuthMiddleware.authenticate,
  userController.checkPermission.bind(userController),
);

// Publique (pas d'AuthMiddleware) : endpoint interne inter-services, même
// contrat que `GET /tresoriers/user/:user_id`.
router.get(
  "/:id/basic",
  userController.getBasicById.bind(userController),
);

router.get(
  "/",
  AuthMiddleware.authenticate,
  authorize(["manage_users"]),
  async (req, res) => {
    try {
      const users = await userController.userService.getAllUsers(req.query);
      res.json({ success: true, data: users });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
);

router.post(
  "/",
  AuthMiddleware.authenticate,
  authorize(["manage_users"]),
  userController.createUser.bind(userController),
);

router.post(
  "/:id/reset-password",
  AuthMiddleware.authenticate,
  authorize(["manage_users"]),
  userController.resetPassword.bind(userController),
);

router.put(
  "/:id/niveau",
  AuthMiddleware.authenticate,
  authorize(["change_niveau"]),
  userController.changeNiveau.bind(userController),
);

router.put(
  "/:id/role",
  AuthMiddleware.authenticate,
  authorize(["change_role"]),
  userController.changeRole.bind(userController),
);

router.put(
  "/:id/photo",
  AuthMiddleware.authenticate,
  authorize(["manage_users"]),
  ...uploadUserPhoto,
  userController.updatePhoto.bind(userController),
);

router.patch(
  "/:id/disable",
  AuthMiddleware.authenticate,
  authorize(["disable_account"]),
  userController.disableAccount.bind(userController),
);

router.patch(
  "/:id/enable",
  AuthMiddleware.authenticate,
  authorize(["disable_account"]),
  userController.enableAccount.bind(userController),
);

router.delete(
  "/:id",
  AuthMiddleware.authenticate,
  authorize(["delete_account"]),
  userController.deleteAccount.bind(userController),
);

router.get(
  "/created-by-me",
  AuthMiddleware.authenticate,
  authorize(["manage_users"]),
  async (req, res) => {
    try {
      const users = await userController.userService.getUsersCreatedBy(
        req.user.id,
      );
      res.json({ success: true, data: users });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
);

router.get(
  "/by-role/:role",
  AuthMiddleware.authenticate,
  authorize(["manage_users"]),
  async (req, res) => {
    try {
      const { role } = req.params;
      const users = await userController.userService.getUsersByRole(role);
      res.json({ success: true, data: users });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
);

module.exports = router;
