const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const CertificatMedical = sequelize.define(
  "CertificatMedical",
  {
    id_certificat: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    num_adherent: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    type_certificat: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    date_validite: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    date_delivrance: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    medecin: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    scan_document: {
      type: DataTypes.BLOB,
      allowNull: true,
    },
    document_path: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    statut: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "Valide",
    },
  },
  {
    tableName: "certificats_medicaux",
    timestamps: true,
    underscored: true,
  },
);

module.exports = CertificatMedical;
