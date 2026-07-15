const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

// Import modules
const routes = require("./routes");
const ErrorHandler = require("./middlewares/errorHandler");
const logger = require("./utils/logger");
const { testConnection, syncDatabase } = require("./config/database");

const app = express();

// ========== MIDDLEWARES ==========

// Security - Configuration plus permissive
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
  }),
);

// ✅ CORS - Configuration SIMPLIFIÉE pour accepter TOUTES les origines
app.use(
  cors({
    origin: "*", // Accepte toutes les origines
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "User-Agent",
    ],
    exposedHeaders: ["Authorization"],
    credentials: true,
  }),
);

// Body parser
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Documents d'adhésion / certificats médicaux / photos de profil : uploadés
// directement sur leur microservice propriétaire respectif — relayés ici en
// dehors de `/api` comme le sont les routes API du même domaine (motif
// "strangler fig", voir routes/index.js).
const proxyTo = require("./middlewares/proxyTo");
const VIE_ASSOCIATIVE_SERVICE_URL =
  process.env.VIE_ASSOCIATIVE_SERVICE_URL || "http://localhost:5013";
const IDENTITE_SERVICE_URL =
  process.env.IDENTITE_SERVICE_URL || "http://localhost:5014";
app.use("/uploads/adhesions", proxyTo(VIE_ASSOCIATIVE_SERVICE_URL));
app.use("/uploads/certificats", proxyTo(VIE_ASSOCIATIVE_SERVICE_URL));
app.use("/uploads/avatars", proxyTo(IDENTITE_SERVICE_URL));

// Logging
app.use(
  morgan("combined", {
    stream: { write: (message) => logger.info(message.trim()) },
  }),
);

// Rate limiting - Moins restrictif pour le mobile
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
  max: process.env.RATE_LIMIT_MAX || 200,
  message: {
    success: false,
    message: "Trop de requêtes, veuillez réessayer plus tard",
  },
  skip: (req) => {
    const userAgent = req.headers["user-agent"] || "";
    return (
      userAgent.includes("Expo") ||
      userAgent.includes("React Native") ||
      userAgent.includes("okhttp") ||
      userAgent.includes("Dalvik")
    );
  },
});
app.use("/api", limiter);

// ========== ROUTES ==========

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    mobileCompatible: true,
    apiVersion: "1.0.0",
  });
});

// API routes
app.use("/api", routes);

// ========== ERROR HANDLING ==========

// 404 handler
app.use(ErrorHandler.notFound);

// Global error handler
app.use(ErrorHandler.handle);

// ========== DATABASE CONNECTION & SERVER START ==========

const PORT = process.env.PORT || 3000;

const initializeApp = async () => {
  try {
    // Test database connection
    const connected = await testConnection();
    if (!connected) {
      logger.error("❌ Database connection failed");
      process.exit(1);
    }

    // Sync database in development
    if (process.env.NODE_ENV === "development") {
      await syncDatabase({ alter: true });
      logger.info("✅ Database synchronized");
    }

    // Alertes d'expiration (adhésion / certificat médical) : ce domaine a
    // quitté le monolithe (voir backend/vie-associative-service), qui gère
    // désormais lui-même sa propre planification quotidienne.

    // Afficher les informations réseau pour le mobile
    const os = require("os");
    const networkInterfaces = os.networkInterfaces();
    const ipAddresses = [];

    Object.keys(networkInterfaces).forEach((interfaceName) => {
      networkInterfaces[interfaceName].forEach((iface) => {
        if (iface.family === "IPv4" && !iface.internal) {
          ipAddresses.push(iface.address);
        }
      });
    });

    logger.info(`✅ Server running on port ${PORT}`);
    logger.info(`📱 Connect mobile app to:`);
    ipAddresses.forEach((ip) => {
      logger.info(`   📱 http://${ip}:${PORT}/api`);
    });
    logger.info(`   🤖 Android Emulator: http://10.0.2.2:${PORT}/api`);
    logger.info(`   🍎 iOS Simulator: http://localhost:${PORT}/api`);
    logger.info(`   🌐 Local: http://localhost:${PORT}/api`);
    logger.info(``);
    logger.info(`✅ Health check: http://localhost:${PORT}/health`);

    // ✅ DÉMARRER LE SERVEUR SUR TOUTES LES INTERFACES
    app.listen(PORT, "0.0.0.0", () => {
      logger.info(`🚀 Server is listening on all interfaces (0.0.0.0:${PORT})`);
      logger.info(
        `📱 Your mobile can connect using: http://${ipAddresses[0] || "your-ip"}:${PORT}/api`,
      );
    });

    logger.info("✅ Application initialized successfully");
  } catch (error) {
    logger.error("❌ Application initialization failed:", error);
    process.exit(1);
  }
};

// Handle unhandled rejections
process.on("unhandledRejection", (err) => {
  logger.error("Unhandled Rejection:", err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception:", err);
  process.exit(1);
});

module.exports = { app, initializeApp };
