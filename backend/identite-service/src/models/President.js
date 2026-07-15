const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const President = sequelize.define(
  "President",
  {
    id_president: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_moniteur: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: "moniteurs",
        key: "id_moniteur",
      },
    },
    annee_en_poste: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    acces: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    schema: process.env.DB_SCHEMA || "identite",
    tableName: "president",
    timestamps: true,
    underscored: true,
  },
);

module.exports = President;
