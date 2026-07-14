const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Adhesion = sequelize.define(
  "Adhesion",
  {
    id_adhesion: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    num_adherent: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    date_debut: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    date_fin: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    montant: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    num_licence_ffesm: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    statut_paiement: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "En attente",
    },
    annee_adhesion: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    document_path: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    montant_paye: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: "adhesions",
    timestamps: true,
    underscored: true,
  },
);

module.exports = Adhesion;
