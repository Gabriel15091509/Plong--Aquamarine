const { sequelize } = require('../src/config/database');

// Ajoute la colonne "photo" (chemin /uploads/avatars/...) sur users, pour
// que TOUS les rôles (adhérent, moniteur, président, trésorier) puissent
// avoir une photo de profil, quel que soit leur compte de connexion.
const addUserPhoto = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connexion établie');

    await sequelize.query(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "photo" VARCHAR(255);
    `);
    console.log('users.photo ajoutée');

    process.exit(0);
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
};

addUserPhoto();
