const { Client } = require("pg");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: "../.env" });

// Configurer la connexion PostgreSQL
const client = new Client({
  host: "localhost",
  port: 5432,
  database: "plongee_db",
  user: "postgres",
  password: "noumsnahitan",
});

const users = [
  {
    email: "president@plongee.com",
    password: "president123",
    name: "Jean Dupont",
    role: "president",
    phone: "0612345678",
  },
  {
    email: "moniteur@plongee.com",
    password: "moniteur123",
    name: "Marie Martin",
    role: "moniteur",
    phone: "0623456789",
  },
  {
    email: "tresorier@plongee.com",
    password: "tresorier123",
    name: "Pierre Durand",
    role: "tresorier",
    phone: "0634567890",
  },
  {
    email: "adherent@plongee.com",
    password: "adherent123",
    name: "Sophie Bernard",
    role: "adherent",
    phone: "0645678901",
  },
  {
    email: "admin@plongee.com",
    password: "admin123",
    name: "Administrateur",
    role: "president",
    phone: "0656789012",
  },
];

const createUsers = async () => {
  try {
    await client.connect();
    console.log("Connexion à la base de données établie");

    // Vérifier si la table users existe
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log("La table users n'existe pas, création...");
      await client.query(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(100) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          name VARCHAR(100) NOT NULL,
          role VARCHAR(20) NOT NULL DEFAULT 'adherent',
          active BOOLEAN DEFAULT TRUE,
          phone VARCHAR(20),
          preferences JSON DEFAULT '{"theme":"light","notifications":true,"language":"fr"}',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log("Table users créée");
    }

    // Créer les utilisateurs
    for (const user of users) {
      const check = await client.query(
        "SELECT id FROM users WHERE email = $1",
        [user.email],
      );
      if (check.rows.length === 0) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(user.password, salt);

        await client.query(
          `
          INSERT INTO users (email, password, name, role, phone, active, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
        `,
          [user.email, hashedPassword, user.name, user.role, user.phone],
        );

        console.log(`Utilisateur créé: ${user.email} (${user.role})`);
      } else {
        console.log(`Utilisateur déjà existant: ${user.email}`);
      }
    }

    console.log("\nComptes disponibles :");
    console.log("================================");
    console.log("President: president@plongee.com / president123");
    console.log("Moniteur: moniteur@plongee.com / moniteur123");
    console.log("Trésorier: tresorier@plongee.com / tresorier123");
    console.log("Adhérent: adherent@plongee.com / adherent123");
    console.log("Admin: admin@plongee.com / admin123");
    console.log("================================");

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error("Erreur:", error);
    await client.end();
    process.exit(1);
  }
};

createUsers();
