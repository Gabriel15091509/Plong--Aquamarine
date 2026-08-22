const { app, initializeApp, startBackgroundJobs } = require("./src/app");
const logger = require("./src/utils/logger");

const PORT = process.env.PORT || 5012;

const startServer = async () => {
  try {
    // initializeApp() ne fait plus que la vérification DB (rapide, doit
    // bloquer) — les jobs d'envoi email ne sont démarrés qu'APRÈS que le
    // serveur écoute déjà, pour qu'un envoi qui traîne ne retarde jamais
    // la disponibilité de /health (voir commentaire dans src/app.js).
    await initializeApp();
    app.listen(PORT, "0.0.0.0", () => {
      logger.info(`finance-service running on http://localhost:${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`API base: http://localhost:${PORT}/api`);
      startBackgroundJobs();
    });
  } catch (error) {
    logger.error("Failed to start finance-service:", error);
    process.exit(1);
  }
};

startServer();
