const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Paiement = sequelize.define(
  "Paiement",
  {
    id_paiement: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    num_adherent: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    date_paiement: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    montant: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    mode: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    motif: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    statut: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "En attente",
    },
    reference: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
  },
  {
    tableName: "paiements",
    timestamps: true,
    underscored: true,
  },
);

module.exports = Paiement;
