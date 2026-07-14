const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Moniteur = sequelize.define(
  "Moniteur",
  {
    id_moniteur: {
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
    num_brevet: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    date_obtention_brevet: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    specialites: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    disponibilites: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    tableName: "moniteurs",
    timestamps: true,
    underscored: true,
  },
);

module.exports = Moniteur;
