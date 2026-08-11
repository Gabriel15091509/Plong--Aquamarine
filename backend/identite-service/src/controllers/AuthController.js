const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { User } = require("../models");
const { sendOtpEmail } = require("../utils/email");

const OTP_VALIDITY_MINUTES = 5;
const OTP_MAX_ATTEMPTS = 5;

const getPermissionsForRole = (role) => {
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
};

const buildAuthResponse = (user) => ({
  token: jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      must_change_password: user.must_change_password,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || "7d" },
  ),
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
    permissions: getPermissionsForRole(user.role),
  },
});

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
          .json({ success: false, message: "Compte désactivé" });

      const isValid = await user.comparePassword(password);
      if (!isValid)
        return res
          .status(401)
          .json({ success: false, message: "Email ou mot de passe incorrect" });

      // Authentification renforcée (exigence 4.4) : le président doit en
      // plus saisir un code à usage unique envoyé par email avant que le
      // JWT ne soit délivré.
      if (user.role === "president") {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const salt = await bcrypt.genSalt(10);
        user.otp_code_hash = await bcrypt.hash(code, salt);
        user.otp_expires_at = new Date(
          Date.now() + OTP_VALIDITY_MINUTES * 60 * 1000,
        );
        user.otp_attempts = 0;
        await user.save();

        await sendOtpEmail({ to: user.email, name: user.name, code });

        return res.json({
          success: true,
          data: { otpRequired: true, email: user.email },
        });
      }

      await user.update({ last_login: new Date() });
      res.json({ success: true, data: buildAuthResponse(user) });
    } catch (error) {
      console.error("Erreur lors de la connexion :", error);
      res
        .status(500)
        .json({ success: false, message: "Erreur lors de la connexion" });
    }
  }

  async verifyOtp(req, res) {
    try {
      const { email, code } = req.body;

      if (!email || !code) {
        return res
          .status(400)
          .json({ success: false, message: "Email et code requis" });
      }

      const user = await User.findOne({ where: { email, role: "president" } });
      if (!user || !user.otp_code_hash || !user.otp_expires_at) {
        return res
          .status(401)
          .json({ success: false, message: "Aucune vérification en attente" });
      }

      if (new Date() > user.otp_expires_at) {
        user.otp_code_hash = null;
        user.otp_expires_at = null;
        user.otp_attempts = 0;
        await user.save();
        return res
          .status(401)
          .json({ success: false, message: "Code expiré, reconnectez-vous" });
      }

      if (user.otp_attempts >= OTP_MAX_ATTEMPTS) {
        user.otp_code_hash = null;
        user.otp_expires_at = null;
        user.otp_attempts = 0;
        await user.save();
        return res.status(401).json({
          success: false,
          message: "Trop de tentatives, reconnectez-vous",
        });
      }

      const isValid = await bcrypt.compare(code, user.otp_code_hash);
      if (!isValid) {
        user.otp_attempts += 1;
        await user.save();
        return res
          .status(401)
          .json({ success: false, message: "Code incorrect" });
      }

      user.otp_code_hash = null;
      user.otp_expires_at = null;
      user.otp_attempts = 0;
      user.last_login = new Date();
      await user.save();

      res.json({ success: true, data: buildAuthResponse(user) });
    } catch (error) {
      console.error("Erreur lors de la vérification du code OTP :", error);
      res
        .status(500)
        .json({ success: false, message: "Erreur lors de la vérification" });
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
              "Le nouveau mot de passe doit contenir au moins 6 caractères",
          });
      }

      const user = await User.findByPk(userId);
      if (!user)
        return res
          .status(404)
          .json({ success: false, message: "Utilisateur non trouvé" });

      // Si ce n'est PAS un changement forcé, vérifier l'ancien mot de passe
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

      user.password = newPassword;
      user.must_change_password = false;
      await user.save();

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
        message: "Mot de passe changé avec succès",
      });
    } catch (error) {
      console.error("Erreur lors du changement de mot de passe :", error);
      res
        .status(500)
        .json({
          success: false,
          message: "Erreur lors du changement de mot de passe",
        });
    }
  }

  getUserPermissions(role) {
    return getPermissionsForRole(role);
  }
}

module.exports = AuthController;
