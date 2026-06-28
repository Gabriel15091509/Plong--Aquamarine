const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Competence = sequelize.define(
  "Competence",
  {
    id_competence: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_formation: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    libelle: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    niveau_requis: {
      type: DataTypes.STRING(20), // ✅ Augmenté à 20 caractères
      allowNull: false,
    },
    acquise: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    date_validation: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    validee_par: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
  },
  {
    tableName: "competences",
    timestamps: true,
    underscored: true,
  },
);

module.exports = Competence;
