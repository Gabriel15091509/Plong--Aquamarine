const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Reparation = sequelize.define(
  "Reparation",
  {
    id_reparation: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    num_inventaire: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    date_constat: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    description_panne: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    prestataire: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    cout: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    date_retour: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    statut: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "En cours",
    },
    id_attribution: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "attributions",
        key: "id_attribution",
      },
    },
    montant_couvert_caution: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    montant_complement_du: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
  },
  {
    tableName: "reparations",
    timestamps: true,
    underscored: true,
  },
);

module.exports = Reparation;
