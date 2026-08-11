const { execSync } = require('child_process');
const { syncDatabase } = require('../src/config/database');

const start = async () => {
  try {
    console.log('Démarrage du serveur...');

    // 1. Exécuter le script de correction
    console.log('Correction de la base de données...');
    try {
      execSync('node scripts/fix-all.js', { stdio: 'inherit' });
    } catch (error) {
      console.log('Erreur lors de la correction, continuation...');
    }

    // 2. Synchroniser la base (désactivé)
    await syncDatabase();

    // 3. Démarrer le serveur
    console.log('Démarrage du serveur Express...');
    require('../server');
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
};

start();