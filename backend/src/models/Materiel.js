const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Materiel = sequelize.define(
  "Materiel",
  {
    num_inventaire: {
      type: DataTypes.STRING(20),
      primaryKey: true,
    },
    categorie: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    marque: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    modele: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    taille: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    epaisseur: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    date_achat: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    etat: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "Bon",
    },
    localisation: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    date_verif_visuelle: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    date_revision_technique: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    date_prochaine_echeance: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    photo: {
      type: DataTypes.BLOB,
      allowNull: true,
    },
  },
  {
    tableName: "materiels",
    timestamps: true,
    underscored: true,
  },
);

module.exports = Materiel;
