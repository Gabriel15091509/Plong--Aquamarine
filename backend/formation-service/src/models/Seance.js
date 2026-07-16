const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Seance = sequelize.define(
  "Seance",
  {
    id_seance: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_formation: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    date_seance: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    type_seance: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    contenu: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    statut: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "Planifiée",
    },
    commentaire: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "seances",
    schema: process.env.DB_SCHEMA || "formation",
    timestamps: true,
    underscored: true,
  },
);

module.exports = Seance;
