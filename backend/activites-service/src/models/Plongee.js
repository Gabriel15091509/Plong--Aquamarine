const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Plongee = sequelize.define(
  "Plongee",
  {
    id_plongee: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    // Plus de FK Postgres vers `adherents` (identite-service, autre schéma).
    num_adherent: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    id_sortie: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    id_palanquee: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    profondeur_max: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    duree: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    temperature_eau: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    visibilite: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    type_plongee: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    observations_faune: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    observations_moniteur: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Plus de FK Postgres vers `moniteurs` (identite-service, autre schéma).
    id_moniteur_validateur: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    lien_photos: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    // Référence applicative (pas de FK Postgres, autre service/schéma) vers la
    // séance pratique de formation-service que cette plongée fait progresser.
    id_seance: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    schema: process.env.DB_SCHEMA || "activites",
    tableName: "plongees",
    timestamps: true,
    underscored: true,
  },
);

module.exports = Plongee;
