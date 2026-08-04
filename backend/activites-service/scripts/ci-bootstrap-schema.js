// Recrée le schéma `activites` à partir des modèles Sequelize actuels —
// utilisé UNIQUEMENT par la CI (job "build", service Postgres éphémère),
// jamais en dev/prod : ce projet ne gère pas son schéma via `sync()`
// normalement (voir scripts/migrate-*.sql), mais aucune de ces migrations
// incrémentales ne recrée la base depuis zéro (elles supposent toutes des
// tables déjà migrées depuis l'ancien monolithe). `sync({ force: true })`
// est la façon la plus fidèle de reconstruire une base de test vide sans
// dupliquer/maintenir un second schéma canonique à la main.
const { sequelize } = require("../src/models");

async function bootstrap() {
  const schema = process.env.DB_SCHEMA || "activites";
  await sequelize.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
  await sequelize.sync({ force: true });
  console.log(`✅ [activites-service] schéma "${schema}" recréé pour les tests`);
  await sequelize.close();
}

bootstrap().catch((err) => {
  console.error("❌ [activites-service] échec du bootstrap schéma :", err);
  process.exit(1);
});
