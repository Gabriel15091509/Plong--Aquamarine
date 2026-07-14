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
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    id_sortie: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    statut: {
      type: DataTypes.STRING(50),
      defaultValue: "En attente",
      allowNull: false,
    },
    rang_liste_attente: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    presence: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    presence_checked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    presence_check_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    presence_check_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    absence_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    absence_justified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    date_confirmation: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    date_inscription: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    montant_du: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    montant_paye: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    paye: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: "inscriptions",
    timestamps: true,
    underscored: true,
  },
);

module.exports = Inscription;
