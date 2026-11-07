const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

module.exports = sequelize.define("AuthSession", {
  token_hash: { type: DataTypes.STRING(64), primaryKey: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  credential_hash: { type: DataTypes.STRING(64), allowNull: false },
  expires_at: { type: DataTypes.DATE, allowNull: false },
  last_seen_at: { type: DataTypes.DATE, allowNull: false },
}, { schema: "security", tableName: "auth_sessions", timestamps: false, indexes: [{ fields: ["user_id"] }, { fields: ["expires_at"] }] });
