const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Composer = sequelize.define(
  "Composer",
  {
    id_palanquee: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    // Plus de FK Postgres vers `adherents` (identite-service, autre schéma).
    num_adherent: {
      type: DataTypes.STRING(20),
      primaryKey: true,
    },
  },
  {
    schema: process.env.DB_SCHEMA || "activites",
    tableName: "composer",
    timestamps: true,
    underscored: true,
  },
);

module.exports = Composer;
