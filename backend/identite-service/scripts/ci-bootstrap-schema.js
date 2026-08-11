// Recrée le schéma `identite` à partir des modèles Sequelize actuels —
// utilisé UNIQUEMENT par la CI (job "build"/E2E, service Postgres éphémère),
// jamais en dev/prod : voir le même script dans activites-service pour le
// détail du raisonnement général.
//
// Cas particulier de ce service : il existe un vrai cycle de FK au niveau
// SQL — users.created_by → president, president.id_moniteur → moniteurs,
// moniteurs.user_id → users (voir les associations `belongsTo` dans
// models/index.js, qui ajoutent la contrainte FK à la colonne même sans
// `references` explicite dans l'attribut brut). `sequelize.sync()` ne peut
// pas créer un cycle en une seule passe de CREATE TABLE (confirmé en
// local : "la relation... moniteurs n'existe pas"). On casse le cycle en
// créant `users` sans la contrainte sur `created_by`, puis on l'ajoute une
// fois que `president` existe.
const { sequelize, User, Moniteur, Tresorier, President, Adherent, Brevet } = require("../src/models");

async function bootstrap() {
  const schema = process.env.DB_SCHEMA || "identite";
  const queryInterface = sequelize.getQueryInterface();

  await sequelize.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
  for (const table of ["brevets", "adherents", "president", "tresoriers", "moniteurs", "users"]) {
    await queryInterface.dropTable({ tableName: table, schema }, { cascade: true }).catch(() => {});
  }

  const usersAttributes = { ...User.rawAttributes };
  usersAttributes.created_by = { ...usersAttributes.created_by };
  delete usersAttributes.created_by.references;
  await queryInterface.createTable({ tableName: "users", schema }, usersAttributes);

  for (const Model of [Moniteur, Tresorier, President, Adherent, Brevet]) {
    await Model.sync();
  }

  await sequelize.query(
    `ALTER TABLE "${schema}"."users" ADD CONSTRAINT users_created_by_fkey ` +
      `FOREIGN KEY (created_by) REFERENCES "${schema}"."president" (id_president) ` +
      `ON DELETE SET NULL ON UPDATE CASCADE`,
  );

  console.log(`[identite-service] schéma "${schema}" recréé pour les tests`);
  await sequelize.close();
}

bootstrap().catch((err) => {
  console.error("[identite-service] échec du bootstrap schéma :", err);
  process.exit(1);
});
