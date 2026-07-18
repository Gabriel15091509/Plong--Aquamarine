const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Echeance = sequelize.define(
  "Echeance",
  {
    id_echeance: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_echeancier: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    numero: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    date_echeance: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    montant: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    statut: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "En attente",
    },
    // Renseigné uniquement une fois l'échéance réglée — voir
    // EcheancierService.payerEcheance.
    id_paiement: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    schema: process.env.DB_SCHEMA || "finance",
    tableName: "echeances",
    timestamps: true,
    underscored: true,
  },
);

module.exports = Echeance;
