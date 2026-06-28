const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Sortie = sequelize.define(
  "Sortie",
  {
    id_sortie: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    date_heure: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    lieu: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    site: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    niveau_requis: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    nb_places: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    profondeur_max: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    duree_estimee: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    tarif: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    statut: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "Planifiée",
    },
    description_site: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    date_ouverture_inscriptions: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    condition_affectation: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "sorties",
    timestamps: true,
    underscored: true,
  },
);

module.exports = Sortie;
