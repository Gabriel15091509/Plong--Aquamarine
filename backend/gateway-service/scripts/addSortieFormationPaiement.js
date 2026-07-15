const { sequelize } = require('../src/config/database');

// Réimplante les colonnes de tarif/paiement Sortie & Formation supprimées
// par removeSortieFormationPaiement.js — one-off (sequelize.sync() est
// désactivé sur ce projet), à exécuter puis à archiver comme les autres
// scripts de migration ponctuels.
const addSortieFormationPaiement = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion établie');

    const additions = [
      { table: 'sorties', column: 'tarif_adherent', ddl: 'DECIMAL(10,2) NOT NULL DEFAULT 0' },
      { table: 'sorties', column: 'tarif_non_adherent', ddl: 'DECIMAL(10,2)' },
      { table: 'inscriptions', column: 'montant_du', ddl: 'DECIMAL(10,2)' },
      { table: 'inscriptions', column: 'montant_paye', ddl: 'DECIMAL(10,2) NOT NULL DEFAULT 0' },
      { table: 'inscriptions', column: 'paye', ddl: 'BOOLEAN NOT NULL DEFAULT false' },
      { table: 'formations', column: 'montant_total', ddl: 'DECIMAL(10,2)' },
      { table: 'formations', column: 'montant_paye', ddl: 'DECIMAL(10,2) NOT NULL DEFAULT 0' },
      { table: 'formations', column: 'statut_paiement', ddl: "VARCHAR(20) NOT NULL DEFAULT 'En attente'" },
    ];

    for (const { table, column, ddl } of additions) {
      await sequelize.query(`
        ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "${column}" ${ddl};
      `);
      console.log(`✅ ${table}.${column} ajoutée`);
    }

    console.log('\n✅ Colonnes de tarif/paiement Sortie & Formation réimplantées !');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

addSortieFormationPaiement();
