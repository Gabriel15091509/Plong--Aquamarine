// backend/src/controllers/AuthController.js
const jwt = require("jsonwebtoken");
const { User } = require("../models");
// âœ… NE PAS importer bcrypt ici â€” le hook User.beforeUpdate s'en charge

class AuthController {
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ success: false, message: "Email et mot de passe requis" });
      }

      const user = await User.findOne({ where: { email } });
      if (!user)
        return res
          .status(401)
          .json({ success: false, message: "Email ou mot de passe incorrect" });
      if (!user.active)
        return res
          .status(401)
          .json({ success: false, message: "Compte dÃ©sactivÃ©" });

      const isValid = await user.comparePassword(password);
      if (!isValid)
        return res
          .status(401)
          .json({ success: false, message: "Email ou mot de passe incorrect" });

      await user.update({ last_login: new Date() });

      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
          must_change_password: user.must_change_password,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || "7d" },
      );

      res.json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            phone: user.phone,
            active: user.active,
            photo: user.photo,
            preferences: user.preferences,
            must_change_password: user.must_change_password,
            permissions: this.getUserPermissions(user.role),
          },
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res
        .status(500)
        .json({ success: false, message: "Erreur lors de la connexion" });
    }
  }

  async changePassword(req, res) {
    try {
      const { oldPassword, newPassword } = req.body;
      const userId = req.user.id;

      if (!newPassword || newPassword.length < 6) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Le nouveau mot de passe doit contenir au moins 6 caractÃ¨res",
          });
      }

      const user = await User.findByPk(userId);
      if (!user)
        return res
          .status(404)
          .json({ success: false, message: "Utilisateur non trouvÃ©" });

      // Si ce n'est PAS un changement forcÃ©, vÃ©rifier l'ancien mot de passe
      if (!user.must_change_password) {
        if (!oldPassword) {
          return res
            .status(400)
            .json({ success: false, message: "Ancien mot de passe requis" });
        }
        const isValid = await user.comparePassword(oldPassword);
        if (!isValid)
          return res
            .status(400)
            .json({ success: false, message: "Ancien mot de passe incorrect" });
      }

      // âœ… Assigner directement â€” le hook beforeUpdate hash automatiquement
      user.password = newPassword;
      user.must_change_password = false;
      await user.save(); // â† dÃ©clenche beforeUpdate â†’ hash automatique

      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
          must_change_password: false,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || "7d" },
      );

      const userData = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        must_change_password: false,
        permissions: this.getUserPermissions(user.role),
      };

      res.json({
        success: true,
        data: { token, user: userData },
        message: "Mot de passe changÃ© avec succÃ¨s",
      });
    } catch (error) {
      console.error("Change password error:", error);
      res
        .status(500)
        .json({
          success: false,
          message: "Erreur lors du changement de mot de passe",
        });
    }
  }

  getUserPermissions(role) {
    const permissions = {
      president: [
        "all",
        "manage_users",
        "manage_staff",
        "view_stats",
        "manage_settings",
        "manage_sorties",
        "validate_plongees",
        "manage_formations",
        "view_adherents",
        "manage_paiements",
        "exports",
        "change_niveau",
        "change_role",
        "disable_account",
        "delete_account",
        "reset_password",
      ],
      moniteur: [
        "manage_sorties",
        "validate_plongees",
        "manage_formations",
        "view_adherents",
        "view_profile",
        "inscription_sorties",
        "view_carnet",
      ],
      adherent: ["view_profile", "inscription_sorties", "view_carnet"],
      tresorier: [
        "manage_paiements",
        "view_stats",
        "exports",
        "view_adherents",
        "view_profile",
      ],
    };
    return permissions[role] || [];
  }
}

module.exports = AuthController;

