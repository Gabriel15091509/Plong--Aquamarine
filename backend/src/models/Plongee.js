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
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    id_sortie: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    id_palanquee: {
      type: DataTypes.INTEGER,
      allowNull: true,
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
    observations_moniteur: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    id_moniteur_validateur: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "moniteurs",
        key: "id_moniteur",
      },
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
