const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Plongee = sequelize.define(
  "Plongee",
  {
    id_plongee: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    num_adherent: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    profondeur_max: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    duree: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    temperature_eau: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    visibilite: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    type_plongee: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    observations_faune: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    valide_moniteur: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    lien_photos: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
  },
  {
    tableName: "plongees",
    timestamps: true,
    underscored: true,
  },
);

module.exports = Plongee;
