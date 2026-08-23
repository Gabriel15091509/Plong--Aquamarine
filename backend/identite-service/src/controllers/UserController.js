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

  async updatePhoto(req, res, next) {
    try {
      const { id } = req.params;
      const { photo_path } = req.body;

      const result = await this.userService.updatePhoto(id, photo_path);
      const { password, ...safeUser } = result.toJSON();

      res.json({
        success: true,
        data: safeUser,
        message: "Photo mise à jour avec succès",
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

  // Surcharge de BaseController.bulkDelete : UserService n'a pas de
  // delete() propre, seulement deleteAccount() (anonymisation RGPD — voir
  // ce commentaire) — le bulkDelete générique appellerait
  // BaseService.delete (suppression SQL brute) et casserait
  // l'anonymisation. Rejoue donc deleteAccount pour chaque id, avec le
  // même résultat détaillé par id que BaseService.bulkDelete.
  async bulkDelete(req, res, next) {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Le champ ids (tableau non vide) est requis",
        });
      }
      const results = [];
      for (const id of ids) {
        try {
          await this.userService.deleteAccount(id);
          results.push({ id, success: true });
        } catch (error) {
          results.push({ id, success: false, message: error.message });
        }
      }
      const failed = results.filter((r) => !r.success);
      res.json({
        success: failed.length === 0,
        data: results,
        message:
          failed.length === 0
            ? `${results.length} compte(s) supprimé(s) avec succès`
            : `${results.length - failed.length}/${results.length} supprimé(s), ${failed.length} échec(s)`,
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

  // RGPD (droit d'accès/portabilité, exigence 4.4) : export JSON des
  // données personnelles du compte connecté.
  async exportMyData(req, res, next) {
    try {
      const data = await this.userService.exportMyData(req.user.id);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="mes-donnees-${req.user.id}.json"`,
      );
      res.json({ success: true, data });
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
