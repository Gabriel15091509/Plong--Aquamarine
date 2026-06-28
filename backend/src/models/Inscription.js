const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Inscription = sequelize.define(
  "Inscription",
  {
    id_inscription: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    num_adherent: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    id_sortie: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    date_inscription: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    statut: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "En attente",
    },
    rang_liste_attente: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    presence: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    date_confirmation: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "inscriptions",
    timestamps: true,
    underscored: true,
  },
);

module.exports = Inscription;
