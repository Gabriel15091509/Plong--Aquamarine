const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Tresorier = sequelize.define(
  "Tresorier",
  {
    id_tresorier: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: "users",
        key: "id",
      },
    },
    annee_en_poste: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    schema: process.env.DB_SCHEMA || "identite",
    tableName: "tresoriers",
    timestamps: true,
    underscored: true,
  },
);

module.exports = Tresorier;
