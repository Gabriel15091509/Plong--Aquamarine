const express = require("express");
const router = express.Router();
const UserController = require("../controllers/UserController");
const AuthMiddleware = require("../middlewares/authMiddleware");
const { uploadUserPhoto } = require("../middlewares/upload");
const { ROLES } = require("../utils/roleScope");

const userController = new UserController();

router.put(
  "/profile",
  AuthMiddleware.authenticate,
  ...uploadUserPhoto,
  userController.updateProfile.bind(userController),
);

router.get(
  "/me/export",
  AuthMiddleware.authenticate,
  userController.exportMyData.bind(userController),
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
  AuthMiddleware.authorize(ROLES.PRESIDENT_ONLY),
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
  AuthMiddleware.authorize(ROLES.PRESIDENT_ONLY),
  userController.createUser.bind(userController),
);

router.post(
  "/:id/reset-password",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_ONLY),
  userController.resetPassword.bind(userController),
);

router.put(
  "/:id/niveau",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_ONLY),
  userController.changeNiveau.bind(userController),
);

router.put(
  "/:id/role",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_ONLY),
  userController.changeRole.bind(userController),
);

router.put(
  "/:id/photo",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_ONLY),
  ...uploadUserPhoto,
  userController.updatePhoto.bind(userController),
);

router.patch(
  "/:id/disable",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_ONLY),
  userController.disableAccount.bind(userController),
);

router.patch(
  "/:id/enable",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_ONLY),
  userController.enableAccount.bind(userController),
);

router.delete(
  "/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_ONLY),
  userController.deleteAccount.bind(userController),
);

// Suppression groupée — même rôle que la suppression unitaire ci-dessus
// (voir UserController.bulkDelete : rejoue deleteAccount par id, pas un
// delete SQL brut).
router.post(
  "/bulk-delete",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_ONLY),
  userController.bulkDelete.bind(userController),
);

router.get(
  "/created-by-me",
  AuthMiddleware.authenticate,
  AuthMiddleware.authorize(ROLES.PRESIDENT_ONLY),
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
  AuthMiddleware.authorize(ROLES.PRESIDENT_ONLY),
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
