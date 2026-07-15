const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Sortie = sequelize.define(
  "Sortie",
  {
    id_sortie: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    date_heure: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    lieu: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    site: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    niveau_requis: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    nb_places: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    profondeur_max: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    duree_estimee: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    statut: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "Planifiée",
    },
    description_site: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    date_ouverture_inscriptions: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    condition_affectation: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    tarif_adherent: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    tarif_non_adherent: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    encadrants: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    // Plus de FK Postgres vers `president` (identite-service, autre
    // schéma) : reste une colonne applicative, non validée en base.
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    schema: process.env.DB_SCHEMA || "activites",
    tableName: "sorties",
    timestamps: true,
    underscored: true,
  },
);

module.exports = Sortie;
