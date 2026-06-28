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
    num_inventaire: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    num_adherent: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    id_sortie: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
    constat_deterioration: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    type: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
  },
  {
    tableName: "attributions",
    timestamps: true,
    underscored: true,
  },
);

module.exports = Attribution;
