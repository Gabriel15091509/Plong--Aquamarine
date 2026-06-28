const { sequelize, syncDatabase, testConnection } = require('../src/config/database');
const logger = require('../src/utils/logger');

const migrate = async () => {
  try {
    // Test connection
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ Database connection failed');
      process.exit(1);
    }

    // Import all models to ensure they are registered
    const models = require('../src/models');
    
    // Force sync with alter: true to create/update tables
    await sequelize.sync({ force: true });
    console.log('✅ Database migrated successfully (tables recreated)');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

migrate();