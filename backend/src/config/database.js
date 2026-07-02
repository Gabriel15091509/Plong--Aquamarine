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

// Test connection function
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

// ✅ Sync database function avec gestion d'erreur
const syncDatabase = async (options = {}) => {
  try {
    // ✅ Désactiver complètement la synchronisation automatique
    // Si vous voulez synchroniser, utilisez alter: false (défaut)
    const syncOptions = {
      alter: false,
      force: false,
      ...options,
    };

    console.log("📝 Synchronisation de la base de données...");
    console.log(`   Options: ${JSON.stringify(syncOptions)}`);

    await sequelize.sync(syncOptions);
    console.log("✅ Database synchronized successfully");
    return true;
  } catch (error) {
    console.error("❌ Database sync failed:", error);
    console.error("   Détails:", error.message);

    // ✅ Afficher plus de détails sur l'erreur
    if (error.parent) {
      console.error("   SQL:", error.parent.sql);
      console.error("   Code:", error.parent.code);
    }

    return false;
  }
};

module.exports = {
  sequelize,
  testConnection,
  syncDatabase,
};
