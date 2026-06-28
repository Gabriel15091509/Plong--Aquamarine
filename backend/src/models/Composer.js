const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Composer = sequelize.define(
  "Composer",
  {
    id_composition: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_palanquee: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    num_adherent: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "composer",
    timestamps: true,
    underscored: true,
  },
);

module.exports = Composer;
