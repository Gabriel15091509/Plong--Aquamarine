const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Backup = sequelize.define(
  "Backup",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    type: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    taille_octets: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    // JSONB : { [schema]: { [table]: [ {...ligne...}, ... ] } }
    contenu: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
  },
  {
    schema: "backup",
    tableName: "snapshots",
    timestamps: true,
    underscored: true,
    createdAt: "created_at",
    updatedAt: false,
  },
);

module.exports = Backup;
