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
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    // Plus de FK Postgres vers `tresoriers` (identite-service, autre
    // schéma) : reste une colonne applicative, non validée en base.
    id_tresorier: {
      type: DataTypes.INTEGER,
      allowNull: true,
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
    type_paiement: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    statut: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "En attente",
    },
    reference_id: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    schema: process.env.DB_SCHEMA || "finance",
    tableName: "paiements",
    timestamps: true,
    underscored: true,
  },
);

module.exports = Paiement;
