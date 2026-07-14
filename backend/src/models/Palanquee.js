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
      allowNull: true,
    },
    id_sortie: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    nom_palanquee: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    id_moniteur_encadrant: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "moniteurs",
        key: "id_moniteur",
      },
    },
    profondeur_max_realisee: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    duree_reelle: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    id_guide_palanquee: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    id_secouriste: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    statut: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "En cours",
    },
    date_cloture: {
      type: DataTypes.DATE,
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
