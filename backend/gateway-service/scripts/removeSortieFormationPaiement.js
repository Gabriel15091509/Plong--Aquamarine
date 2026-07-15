const { sequelize } = require('../src/config/database');

// Le club ne fait payer que l'adhésion annuelle : les sorties et formations
// n'ont plus de notion de tarif/paiement. Ce script retire les colonnes
// devenues orphelines (one-off, comme fix-all.js) sans toucher au reste des
// données.
const removeSortieFormationPaiement = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion établie');

    const drops = [
      { table: 'sorties', column: 'tarif_adherent' },
      { table: 'sorties', column: 'tarif_non_adherent' },
      { table: 'inscriptions', column: 'paye' },
      { table: 'inscriptions', column: 'montant_paye' },
      { table: 'inscriptions', column: 'montant_du' },
      { table: 'formations', column: 'montant_total' },
      { table: 'formations', column: 'montant_paye' },
      { table: 'formations', column: 'statut_paiement' },
    ];

    for (const { table, column } of drops) {
      await sequelize.query(`
        ALTER TABLE "${table}" DROP COLUMN IF EXISTS "${column}";
      `);
      console.log(`✅ ${table}.${column} supprimée`);
    }

    console.log('\n✅ Colonnes de tarif/paiement Sortie & Formation supprimées !');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

removeSortieFormationPaiement();
