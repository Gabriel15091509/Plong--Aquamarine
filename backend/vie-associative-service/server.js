const { app, initializeApp, startBackgroundJobs } = require("./src/app");
const logger = require("./src/utils/logger");

const PORT = process.env.PORT || 5013;

const startServer = async () => {
  try {
    // initializeApp() ne fait plus que la vérification DB (rapide, doit
    // bloquer) — les jobs de fond ne sont démarrés qu'APRÈS que le
    // serveur écoute déjà (voir commentaire dans src/app.js).
    await initializeApp();
    app.listen(PORT, "0.0.0.0", () => {
      logger.info(`vie-associative-service running on http://localhost:${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`API base: http://localhost:${PORT}/api`);
      startBackgroundJobs();
    });
  } catch (error) {
    logger.error("Failed to start vie-associative-service:", error);
    process.exit(1);
  }
};

startServer();
