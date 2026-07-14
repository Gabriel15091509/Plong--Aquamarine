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
    id_tresorier: {
      // Nullable : un président/moniteur peut aussi enregistrer un paiement
      // (ex. sur le bateau) sans avoir de profil Tresorier dédié.
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "tresoriers",
        key: "id_tresorier",
      },
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
    tableName: "paiements",
    timestamps: true,
    underscored: true,
  },
);

module.exports = Paiement;
