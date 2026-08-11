const { Sequelize } = require("sequelize");
require("dotenv").config();

// Même instance Postgres que les autres services (pour l'instant), mais un
// schéma dédié (`DB_SCHEMA`) : c'est ce qui matérialise le cloisonnement
// logique des données de materiel-service par rapport au reste — voir
// la section "Décisions d'architecture" du plan de découpage en microservices.
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",
    // `searchPath` couvre les requêtes brutes ; chaque modèle fixe en plus
    // explicitement son propre `schema` (voir models/Materiel.js) — c'est ce
    // second réglage, documenté par Sequelize pour le multi-schéma, qui est
    // réellement fiable indépendamment du pooling de connexions.
    searchPath: process.env.DB_SCHEMA || "materiel",
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
    console.log("[materiel-service] Connexion à la base de données établie.");
    return true;
  } catch (error) {
    console.error("[materiel-service] Impossible de se connecter à la base de données :", error);
    return false;
  }
};

module.exports = { sequelize, testConnection };
