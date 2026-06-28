const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Palanquee = sequelize.define(
  "Palanquee",
  {
    id_palanquee: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_plongee: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    nom_palanquee: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    profondeur_max_realisee: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    duree_reelle: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: "palanquees",
    timestamps: true,
    underscored: true,
  },
);

module.exports = Palanquee;
