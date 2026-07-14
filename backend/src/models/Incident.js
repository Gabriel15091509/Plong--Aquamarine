const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Incident = sequelize.define(
  "Incident",
  {
    id_incident: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_sortie: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    date_heure: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    type: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    mesures_prises: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    cloture: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    date_cloture: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    declared_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "president",
        key: "id_president",
      },
    },
  },
  {
    tableName: "incidents",
    timestamps: true,
    underscored: true,
  },
);

module.exports = Incident;
