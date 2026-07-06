const { sequelize } = require('../src/config/database');

const fixAll = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion établie');

    // ✅ 1. Ajouter date_inscription
    console.log('📝 Vérification de date_inscription...');
    await sequelize.query(`
      ALTER TABLE "inscriptions" 
      ADD COLUMN IF NOT EXISTS "date_inscription" TIMESTAMP WITH TIME ZONE;
    `);
    
    await sequelize.query(`
      UPDATE "inscriptions" 
      SET "date_inscription" = COALESCE("created_at", NOW()) 
      WHERE "date_inscription" IS NULL;
    `);
    
    await sequelize.query(`
      ALTER TABLE "inscriptions" 
      ALTER COLUMN "date_inscription" SET DEFAULT NOW();
    `);
    console.log('✅ date_inscription corrigée');

    // ✅ 2. Ajouter les colonnes de présence
    console.log('📝 Vérification des colonnes de présence...');
    const presenceColumns = [
      { name: 'presence', type: 'BOOLEAN', default: 'false' },
      { name: 'presence_checked', type: 'BOOLEAN', default: 'false' },
      { name: 'presence_check_time', type: 'TIMESTAMP WITH TIME ZONE', default: null },
      { name: 'presence_check_by', type: 'INTEGER', default: null },
      { name: 'absence_reason', type: 'TEXT', default: null },
      { name: 'absence_justified', type: 'BOOLEAN', default: 'false' },
    ];

    for (const col of presenceColumns) {
      await sequelize.query(`
        ALTER TABLE "inscriptions" 
        ADD COLUMN IF NOT EXISTS "${col.name}" ${col.type};
      `);
      if (col.default !== null) {
        await sequelize.query(`
          ALTER TABLE "inscriptions" 
          ALTER COLUMN "${col.name}" SET DEFAULT ${col.default};
        `);
      }
      console.log(`✅ Colonne ${col.name} vérifiée`);
    }

    console.log('\n✅ Toutes les corrections sont terminées !');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

fixAll();