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
    console.log("[gateway-service] Connexion à la base de données établie.");
    return true;
  } catch (error) {
    console.error("[gateway-service] Impossible de se connecter à la base de données :", error);
    return false;
  }
};

// Synchronisation désactivée : le schéma est géré manuellement (migrations).
const syncDatabase = async (_options = {}) => {
  try {
    console.log("[gateway-service] Synchronisation ignorée (gestion manuelle du schéma).");
    return true;
  } catch (error) {
    console.error("[gateway-service] Échec de la synchronisation de la base de données :", error);
    return false;
  }
};

module.exports = {
  sequelize,
  testConnection,
  syncDatabase,
};
