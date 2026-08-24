const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { User } = require("../models");
const { sendPasswordResetEmail } = require("../utils/email");
// OTP président désactivé (2026-08-22, voir plus bas dans login()) : ces
// deux imports/constantes ne servent plus qu'au bloc commenté, laissés en
// commentaire eux aussi pour repartir tel quel à la réactivation.
// const { sendOtpEmail } = require("../utils/email");

// const OTP_VALIDITY_MINUTES = 5;
const OTP_MAX_ATTEMPTS = 5;
const RESET_TOKEN_VALIDITY_MINUTES = 60;

const hashResetToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

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
      // Désactivée (2026-08-22, demande explicite) : bloc entier mis en
      // commentaire plutôt que supprimé, pour pouvoir la réactiver
      // simplement en décommentant. Le kill-switch PRESIDENT_2FA_DISABLED
      // (env var, voir k8s/base/plongee-config.env) existait déjà mais
      // dépend d'une variable déployée côté infra ; ici la coupure est
      // dans le code lui-même, indépendante de toute config d'environnement.
      // const president2faDisabled = process.env.PRESIDENT_2FA_DISABLED === "true";
      // if (user.role === "president" && !president2faDisabled) {
      //   const code = Math.floor(100000 + Math.random() * 900000).toString();
      //   const salt = await bcrypt.genSalt(10);
      //   user.otp_code_hash = await bcrypt.hash(code, salt);
      //   user.otp_expires_at = new Date(
      //     Date.now() + OTP_VALIDITY_MINUTES * 60 * 1000,
      //   );
      //   user.otp_attempts = 0;
      //   await user.save();
      //
      //   await sendOtpEmail({ to: user.email, name: user.name, code });
      //
      //   return res.json({
      //     success: true,
      //     data: { otpRequired: true, email: user.email },
      //   });
      // }

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

  // "Mot de passe oublié ?" (LoginPage.jsx) — étape 1 : reçoit un email,
  // vérifie qu'un compte actif existe AVANT d'envoyer quoi que ce soit, et
  // répond explicitement dans les deux cas (demande explicite, 2026-08-24 —
  // remplace la réponse générique précédente qui masquait volontairement
  // l'existence du compte contre l'énumération ; accepté ici vu la taille
  // du club, au profit d'un retour plus clair pour l'utilisateur).
  async forgotPassword(req, res) {
    try {
      const { email, resetUrlBase } = req.body;
      if (!email) {
        return res
          .status(400)
          .json({ success: false, message: "Email requis" });
      }

      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Aucun compte n'est associé à cet email",
        });
      }
      if (!user.active) {
        return res
          .status(403)
          .json({ success: false, message: "Compte désactivé" });
      }

      const token = crypto.randomBytes(32).toString("hex");
      user.reset_token_hash = hashResetToken(token);
      user.reset_token_expires_at = new Date(
        Date.now() + RESET_TOKEN_VALIDITY_MINUTES * 60 * 1000,
      );
      await user.save();

      const base = resetUrlBase || "http://localhost:3000";
      const resetUrl = `${base}/reset-password?token=${token}`;

      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetUrl,
        validityMinutes: RESET_TOKEN_VALIDITY_MINUTES,
      });

      return res.json({
        success: true,
        message: "Un lien de réinitialisation vient d'être envoyé à votre adresse email.",
      });
    } catch (error) {
      console.error("Erreur lors de la demande de réinitialisation :", error);
      return res.status(500).json({
        success: false,
        message: "Erreur lors de l'envoi du lien de réinitialisation",
      });
    }
  }

  // "Mot de passe oublié ?" — étape 2 : vérifie le jeton reçu par email et
  // enregistre le nouveau mot de passe. Connecte directement l'utilisateur
  // (même comportement que changePassword ci-dessous) plutôt que de le
  // renvoyer se connecter avec le mot de passe qu'il vient de choisir.
  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res
          .status(400)
          .json({ success: false, message: "Jeton et nouveau mot de passe requis" });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Le nouveau mot de passe doit contenir au moins 6 caractères",
        });
      }

      const user = await User.findOne({
        where: { reset_token_hash: hashResetToken(token) },
      });

      if (
        !user ||
        !user.reset_token_expires_at ||
        new Date() > user.reset_token_expires_at
      ) {
        return res.status(400).json({
          success: false,
          message: "Lien de réinitialisation invalide ou expiré",
        });
      }

      user.password = newPassword;
      user.must_change_password = false;
      user.reset_token_hash = null;
      user.reset_token_expires_at = null;
      user.last_login = new Date();
      await user.save();

      res.json({
        success: true,
        data: buildAuthResponse(user),
        message: "Mot de passe réinitialisé avec succès",
      });
    } catch (error) {
      console.error("Erreur lors de la réinitialisation du mot de passe :", error);
      res.status(500).json({
        success: false,
        message: "Erreur lors de la réinitialisation du mot de passe",
      });
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
