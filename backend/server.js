const { app, initializeApp } = require('./src/app');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Initialize application
    await initializeApp();

    // Start server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on http://localhost:${PORT}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
      logger.info(`📝 API Base: http://localhost:${PORT}/api`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV}`);
    });

    // Graceful shutdown
    const shutdown = () => {
      logger.info('🛑 Shutting down gracefully...');
      server.close(() => {
        logger.info('💤 Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();