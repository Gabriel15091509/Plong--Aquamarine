const { app, initializeApp } = require("./src/app");
const logger = require("./src/utils/logger");
const os = require("os");

// Port par défaut pour le backend
const DEFAULT_PORT = 5000;

// Fonction pour trouver un port disponible
const findAvailablePort = (startPort) => {
  return new Promise((resolve, reject) => {
    const server = require("net").createServer();
    server.once("error", (err) => {
      if (err.code === "EADDRINUSE") {
        resolve(findAvailablePort(startPort + 1));
      } else {
        reject(err);
      }
    });
    server.once("listening", () => {
      server.close();
      resolve(startPort);
    });
    server.listen(startPort, "0.0.0.0");
  });
};

const getLocalIP = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
};

const startServer = async () => {
  try {
    await initializeApp();

    const localIP = getLocalIP();

    // Trouver un port disponible à partir de DEFAULT_PORT
    const PORT = await findAvailablePort(DEFAULT_PORT);

    const server = app.listen(PORT, "0.0.0.0", () => {
      logger.info(`Gateway running on http://0.0.0.0:${PORT}`);
      logger.info(`Mobile access: http://${localIP}:${PORT}`);

      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`API Base: http://localhost:${PORT}/api`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
      logger.info(``);
      logger.info(`Sur téléphone : http://${localIP}:${PORT}/api`);

      // Important pour React : le frontend utilise le port 3000
      logger.info(`Frontend React: http://localhost:3000`);
    });

    const shutdown = () => {
      logger.info("Shutting down gracefully...");
      server.close(() => {
        logger.info("Server closed");
        process.exit(0);
      });
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
