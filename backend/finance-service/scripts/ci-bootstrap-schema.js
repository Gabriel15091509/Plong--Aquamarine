// Recrée le schéma `finance` à partir des modèles Sequelize actuels —
// utilisé UNIQUEMENT par la CI (job "build"/E2E, service Postgres éphémère),
// jamais en dev/prod : voir le même script dans activites-service pour le
// détail du raisonnement.
const { sequelize } = require("../src/models");

async function bootstrap() {
  const schema = process.env.DB_SCHEMA || "finance";
  await sequelize.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
  await sequelize.sync({ force: true });
  console.log(`✅ [finance-service] schéma "${schema}" recréé pour les tests`);
  await sequelize.close();
}

bootstrap().catch((err) => {
  console.error("❌ [finance-service] échec du bootstrap schéma :", err);
  process.exit(1);
});
