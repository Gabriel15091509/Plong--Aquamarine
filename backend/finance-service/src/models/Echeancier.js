const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Echeancier = sequelize.define(
  "Echeancier",
  {
    id_echeancier: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    type_paiement: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    reference_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    num_adherent: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    id_tresorier: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    montant_total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    nb_echeances: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    date_debut: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    statut: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "En cours",
    },
  },
  {
    schema: process.env.DB_SCHEMA || "finance",
    tableName: "echeanciers",
    timestamps: true,
    underscored: true,
  },
);

module.exports = Echeancier;
