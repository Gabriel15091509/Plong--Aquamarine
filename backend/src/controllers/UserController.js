const BaseController = require("./BaseController");
const UserService = require("../services/UserService");

class UserController extends BaseController {
  constructor() {
    const service = new UserService();
    super(service);
    this.userService = service;
  }

  async createUser(req, res) {
    try {
      // ✅ Vérifier que req.user existe et a les permissions
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: "Non authentifié",
        });
      }

      const { email, name, role, phone, contact_urgence, niveau } = req.body;
      const createdBy = req.user.id;

      // ✅ Vérifier les permissions
      const canCreateUser =
        req.user.role === "president" ||
        (req.user.hasPermission && req.user.hasPermission("manage_users"));

      if (!canCreateUser) {
        return res.status(403).json({
          success: false,
          message:
            "Accès refusé - Vous n'avez pas les permissions pour créer un utilisateur",
        });
      }

      const result = await this.userService.createUserByDirector(
        {
          email,
          name,
          role: role || "adherent",
          phone,
          contact_urgence,
          niveau,
        },
        createdBy,
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
      res.status(400).json({
        success: false,
        message: error.message || "Erreur lors de la création de l'utilisateur",
      });
    }
  }

  // ✅ Changer le mot de passe (utilisateur connecté)
  async changePassword(req, res) {
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
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // ✅ Réinitialiser le mot de passe (par le DT)
  async resetPassword(req, res) {
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
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // ✅ Changer le niveau (par le DT)
  async changeNiveau(req, res) {
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
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // ✅ Changer le rôle (par le DT)
  async changeRole(req, res) {
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
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // ✅ Désactiver un compte (par le DT)
  async disableAccount(req, res) {
    try {
      const { id } = req.params;

      const result = await this.userService.disableAccount(id);

      res.json({
        success: true,
        data: result,
        message: "Compte désactivé avec succès",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // ✅ Réactiver un compte (par le DT)
  async enableAccount(req, res) {
    try {
      const { id } = req.params;

      const result = await this.userService.enableAccount(id);

      res.json({
        success: true,
        data: result,
        message: "Compte réactivé avec succès",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // ✅ Supprimer un compte (par le DT)
  async deleteAccount(req, res) {
    try {
      const { id } = req.params;

      await this.userService.deleteAccount(id);

      res.json({
        success: true,
        message: "Compte supprimé avec succès",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // ✅ Mettre à jour son profil (utilisateur connecté)
  async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const { email, phone, contact_urgence, name } = req.body;

      const result = await this.userService.updateProfile(userId, {
        email,
        phone,
        contact_urgence,
        name,
      });

      res.json({
        success: true,
        data: result,
        message: "Profil mis à jour avec succès",
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // ✅ Vérifier les permissions
  async checkPermission(req, res) {
    try {
      const { permission } = req.params;
      const hasPermission = req.user.hasPermission(permission);

      res.json({
        success: true,
        data: { hasPermission },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = UserController;
