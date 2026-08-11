const { app, initializeApp } = require("./src/app");
const logger = require("./src/utils/logger");

const PORT = process.env.PORT || 5014;

const startServer = async () => {
  try {
    await initializeApp();
    app.listen(PORT, "0.0.0.0", () => {
      logger.info(`identite-service running on http://localhost:${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`API base: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    logger.error("Failed to start identite-service:", error);
    process.exit(1);
  }
};

startServer();
