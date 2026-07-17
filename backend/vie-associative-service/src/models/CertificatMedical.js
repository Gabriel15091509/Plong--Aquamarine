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
    // Plus de FK Postgres vers `adherents` (identite-service, autre schéma) :
    // reste une colonne applicative, non validée en base.
    num_adherent: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    type_certificat: {
      type: DataTypes.ENUM("Sportif", "Plongée", "Généraliste", "Médecin hyperbare"),
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
    schema: process.env.DB_SCHEMA || "vie_associative",
    tableName: "certificats_medicaux",
    timestamps: true,
    underscored: true,
  },
);

module.exports = CertificatMedical;
