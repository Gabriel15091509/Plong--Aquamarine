const { Client } = require("pg");
require("dotenv").config({ path: "../.env" });

// Configurer la connexion PostgreSQL
const client = new Client({
  host: "localhost",
  port: 5432,
  database: "plongee_db",
  user: "postgres",
  password: "noumsnahitan",
});

const listUsers = async () => {
  try {
    await client.connect();
    console.log("✅ Connexion à la base de données établie\n");

    // Vérifier si la table users existe
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log("⚠️ La table users n'existe pas !");
      console.log("💡 Exécutez d'abord le script de création : node create-users.js");
      await client.end();
      process.exit(0);
    }

    // Compter le nombre total d'utilisateurs
    const countResult = await client.query("SELECT COUNT(*) FROM users");
    const totalUsers = parseInt(countResult.rows[0].count);
    
    console.log(`📊 ${totalUsers} utilisateur(s) trouvé(s) :\n`);

    // Lister tous les utilisateurs
    const result = await client.query(`
      SELECT 
        id, 
        email, 
        name, 
        role, 
        active,
        phone,
        created_at,
        last_login,
        must_change_password
      FROM users 
      ORDER BY id ASC
    `);

    if (result.rows.length === 0) {
      console.log("📭 Aucun utilisateur dans la base");
    } else {
      result.rows.forEach((user, index) => {
        console.log(`👤 Utilisateur #${index + 1}`);
        console.log(`  ID: ${user.id}`);
        console.log(`  Nom: ${user.name}`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Rôle: ${user.role}`);
        console.log(`  Actif: ${user.active ? '✅ Oui' : '❌ Non'}`);
        console.log(`  Téléphone: ${user.phone || 'Non renseigné'}`);
        console.log(`  Créé le: ${user.created_at ? new Date(user.created_at).toLocaleString('fr-FR') : 'N/A'}`);
        console.log(`  Dernière connexion: ${user.last_login ? new Date(user.last_login).toLocaleString('fr-FR') : 'Jamais'}`);
        console.log(`  Doit changer mot de passe: ${user.must_change_password ? '✅ Oui' : '❌ Non'}`);
        console.log('---');
      });

      // Résumé par rôle
      const roleStats = await client.query(`
        SELECT role, COUNT(*) as count 
        FROM users 
        GROUP BY role 
        ORDER BY role
      `);
      
      console.log('\n📈 Statistiques par rôle :');
      console.log('========================');
      roleStats.rows.forEach(stat => {
        console.log(`  ${stat.role}: ${stat.count} utilisateur(s)`);
      });
    }

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur:", error);
    await client.end();
    process.exit(1);
  }
};

listUsers();