const BaseController = require("./BaseController");
const UserService = require("../services/UserService");
const { withStatus } = require("../utils/errors");

class UserController extends BaseController {
  constructor() {
    const service = new UserService();
    super(service);
    this.userService = service;
  }

  async createUser(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: "Non authentifié",
        });
      }

      const { email, name, role, phone, password } = req.body;

      const result = await this.userService.createGenericUser(
        {
          email,
          name,
          role: role || "adherent",
          phone,
          password,
        },
        req.user,
      );

      res.status(201).json({
        success: true,
        data: result.user,
        message:
          "Utilisateur créé avec succès. Un email a été envoyé avec les identifiants.",
        tempPassword: result.tempPassword,
      });
    } catch (error) {
      console.error("Erreur création utilisateur:", error);
      next(withStatus(error, 400));
    }
  }

  async changePassword(req, res, next) {
    try {
      const { oldPassword, newPassword } = req.body;
      const userId = req.user.id;

      const result = await this.userService.changePassword(
        userId,
        oldPassword,
        newPassword,
      );

      res.json({
        success: true,
        data: result,
        message: "Mot de passe changé avec succès",
      });
    } catch (error) {
      next(withStatus(error, 400));
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { id } = req.params;

      const result = await this.userService.resetPasswordByDirector(id);

      res.json({
        success: true,
        data: result.user,
        message: "Mot de passe réinitialisé. Un email a été envoyé.",
        tempPassword: result.tempPassword,
      });
    } catch (error) {
      next(withStatus(error, 400));
    }
  }

  async changeNiveau(req, res, next) {
    try {
      const { id } = req.params;
      const { niveau } = req.body;

      const result = await this.userService.changeNiveau(id, niveau);

      res.json({
        success: true,
        data: result,
        message: "Niveau mis à jour avec succès",
      });
    } catch (error) {
      next(withStatus(error, 400));
    }
  }

  async changeRole(req, res, next) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      const result = await this.userService.changeRole(id, role);

      res.json({
        success: true,
        data: result,
        message: "Rôle mis à jour avec succès",
      });
    } catch (error) {
      next(withStatus(error, 400));
    }
  }

  async disableAccount(req, res, next) {
    try {
      const { id } = req.params;

      const result = await this.userService.disableAccount(id);

      res.json({
        success: true,
        data: result,
        message: "Compte désactivé avec succès",
      });
    } catch (error) {
      next(withStatus(error, 400));
    }
  }

  async enableAccount(req, res, next) {
    try {
      const { id } = req.params;

      const result = await this.userService.enableAccount(id);

      res.json({
        success: true,
        data: result,
        message: "Compte réactivé avec succès",
      });
    } catch (error) {
      next(withStatus(error, 400));
    }
  }

  async deleteAccount(req, res, next) {
    try {
      const { id } = req.params;

      await this.userService.deleteAccount(id);

      res.json({
        success: true,
        message: "Compte supprimé avec succès",
      });
    } catch (error) {
      next(withStatus(error, 400));
    }
  }

  async updateProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const { email, phone, contact_urgence, name, photo_path } = req.body;

      const result = await this.userService.updateProfile(userId, {
        email,
        phone,
        contact_urgence,
        name,
        ...(photo_path ? { photo: photo_path } : {}),
      });

      const { password, ...safeUser } = result.toJSON();
      res.json({
        success: true,
        data: safeUser,
        message: "Profil mis à jour avec succès",
      });
    } catch (error) {
      next(withStatus(error, 400));
    }
  }

  // Endpoint interne (public, pas d'AuthMiddleware) : utilisé par
  // activites-service pour afficher qui a pointé une présence.
  async getBasicById(req, res, next) {
    try {
      const result = await this.userService.getBasicById(req.params.id);
      if (!result) {
        return res.status(404).json({ success: false, message: "Utilisateur non trouvé" });
      }
      res.json({ success: true, data: result });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }

  async checkPermission(req, res, next) {
    try {
      const { permission } = req.params;
      const hasPermission = req.user.hasPermission(permission);

      res.json({
        success: true,
        data: { hasPermission },
      });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }
}

module.exports = UserController;
