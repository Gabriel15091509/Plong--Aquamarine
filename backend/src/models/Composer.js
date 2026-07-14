const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Composer = sequelize.define(
  "Composer",
  {
    id_palanquee: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    num_adherent: {
      type: DataTypes.STRING(20),
      primaryKey: true,
    },
  },
  {
    tableName: "composer",
    timestamps: true,
    underscored: true,
  },
);

module.exports = Composer;
