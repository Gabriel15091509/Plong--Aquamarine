const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Attribution = sequelize.define(
  "Attribution",
  {
    id_attribution: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    // Plus de FK Postgres vers `materiels` (materiel-service, autre schéma).
    num_inventaire: {
      type: DataTypes.STRING(20),
      allowNull: false,
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
    date_attribution: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    etat_depart: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    etat_retour: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    date_retour_prevue: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    date_retour_reel: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    constat_deterioration: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    montant_caution: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    statut_caution: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: "Aucune",
    },
  },
  {
    schema: process.env.DB_SCHEMA || "activites",
    tableName: "attributions",
    timestamps: true,
    underscored: true,
  },
);

module.exports = Attribution;
