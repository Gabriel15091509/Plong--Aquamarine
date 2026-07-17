const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Adherent = sequelize.define(
  "Adherent",
  {
    num_adherent: {
      type: DataTypes.STRING(20),
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: "users",
        key: "id",
      },
    },
    civilite: {
      type: DataTypes.ENUM("M.", "Mme", "Mlle"),
      allowNull: false,
    },
    nom: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    prenom: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    date_naissance: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: true,
      },
    },
    adresse: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    telephone: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    contact_urgence: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    niveau: {
      type: DataTypes.ENUM(
        "Baptême",
        "Niveau 1",
        "Niveau 2",
        "Niveau 3",
        "Niveau 4",
        "Moniteur",
      ),
      allowNull: true,
    },
    date_obtention_niveau: {
      type: DataTypes.DATE,
      allowNull: true,
      validate: {
        isDate: true,
      },
    },
    num_brevet: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    statut: {
      type: DataTypes.ENUM(
        "Actif",
        "Inactif",
        "Suspendu",
        "En formation",
        "Ancien",
      ),
      allowNull: false,
      defaultValue: "Actif",
    },
    date_inscription: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    nb_plongees_total: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    photo: {
      type: DataTypes.BLOB,
      allowNull: true,
    },
    archived_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "president",
        key: "id_president",
      },
    },
    archived_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    schema: process.env.DB_SCHEMA || "identite",
    tableName: "adherents",
    timestamps: true,
    underscored: true,
  },
);

module.exports = Adherent;
