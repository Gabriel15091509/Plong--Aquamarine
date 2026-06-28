const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Formation = sequelize.define(
  "Formation",
  {
    id_formation: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    num_adherent: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    niveau_vise: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    date_debut: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    date_fin_prevue: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    statut: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "En cours",
    },
    nb_seances_realisees: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    commentaire_moniteur: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "formations",
    timestamps: true,
    underscored: true,
  },
);

module.exports = Formation;
