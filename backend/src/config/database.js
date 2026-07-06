const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    define: {
      timestamps: true,
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
);

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connection established successfully.");
    return true;
  } catch (error) {
    console.error("❌ Unable to connect to the database:", error);
    return false;
  }
};

// ✅ Sync database - DÉSACTIVÉE
const syncDatabase = async (options = {}) => {
  try {
    console.log("✅ Database sync skipped (manual management)");
    return true;
  } catch (error) {
    console.error("❌ Database sync failed:", error);
    return false;
  }
};

module.exports = {
  sequelize,
  testConnection,
  syncDatabase,
};
