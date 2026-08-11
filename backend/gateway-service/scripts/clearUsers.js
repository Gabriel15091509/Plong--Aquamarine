const { Client } = require("pg");
require("dotenv").config({ path: "../.env" });

// Connexion directe à PostgreSQL
const client = new Client({
  host: "localhost",
  port: 5432,
  database: "plongee_db",
  user: "postgres",
  password: "noumsnahitan",
});

const clearUsers = async () => {
  try {
    await client.connect();
    console.log("Connexion à la base de données établie");

    // Vider la table users
    await client.query("TRUNCATE TABLE users RESTART IDENTITY CASCADE;");
    console.log("Tous les utilisateurs ont été supprimés");

    // Réinitialiser la séquence
    await client.query("ALTER SEQUENCE users_id_seq RESTART WITH 1;");
    console.log("Séquence réinitialisée");

    // Vérifier
    const result = await client.query("SELECT COUNT(*) FROM users;");
    console.log(`${result.rows[0].count} utilisateurs restants`);

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error("Erreur:", error.message);
    await client.end();
    process.exit(1);
  }
};

clearUsers();
