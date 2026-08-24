const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");
const bcrypt = require("bcryptjs");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM(
        "president",
        "moniteur",
        "adherent",
        "tresorier",
      ),
      allowNull: false,
      defaultValue: "adherent",
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    must_change_password: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    photo: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    preferences: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {
        theme: "light",
        notifications: true,
        language: "fr",
      },
    },
    // Plus de FK Postgres vers `users` (self-référence conservée : reste
    // dans le même schéma, mais volontairement non contrainte pour rester
    // cohérent avec le reste du modèle inter-services).
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    // Authentification renforcée du président (2FA par email, exigence
    // 4.4) — non utilisés pour les autres rôles.
    otp_code_hash: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    otp_expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    otp_attempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    // Mot de passe oublié : reset_token_hash/reset_token_expires_at
    // RETIRÉS TEMPORAIREMENT (2026-08-24) — les définir ici fait que
    // Sequelize les inclut dans le SELECT de TOUTE requête User (y compris
    // le login), qui échoue tant que la migration
    // (scripts/migrate-reset-password.sql) n'a pas été appliquée en
    // production : ça a cassé la connexion de tous les comptes. À
    // réactiver seulement une fois la migration confirmée appliquée — voir
    // AuthController.forgotPassword/resetPassword, désactivés en
    // attendant (503) pour éviter le même problème d'un autre endroit.
  },
  {
    schema: process.env.DB_SCHEMA || "identite",
    tableName: "users",
    timestamps: true,
    underscored: true,
  },
);

// Hooks pour hasher le mot de passe
User.beforeCreate(async (user) => {
  if (user.password) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

User.beforeUpdate(async (user) => {
  if (user.changed("password")) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

// Méthode pour vérifier le mot de passe
User.prototype.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Méthode pour vérifier les permissions
User.prototype.hasPermission = function (permission) {
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

  const userPermissions = permissions[this.role] || [];
  return (
    userPermissions.includes("all") || userPermissions.includes(permission)
  );
};

module.exports = User;
