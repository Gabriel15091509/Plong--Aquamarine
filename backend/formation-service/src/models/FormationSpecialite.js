const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const FormationSpecialite = sequelize.define(
  "FormationSpecialite",
  {
    id_specialite_formation: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    num_adherent: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    id_moniteur: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    type_specialite: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    date_debut: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    date_obtention_prevue: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    statut: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "En cours",
    },
    commentaire: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "formations_specialites",
    schema: process.env.DB_SCHEMA || "formation",
    timestamps: true,
    underscored: true,
  },
);

module.exports = FormationSpecialite;
