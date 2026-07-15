const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const path = require("path");
const cron = require("node-cron");
require("dotenv").config();

const routes = require("./routes");
const ErrorHandler = require("./middlewares/errorHandler");
const logger = require("./utils/logger");
const AlerteService = require("./services/AlerteService");
const { sequelize, testConnection } = require("./config/database");

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
  }),
);

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "User-Agent",
    ],
    credentials: true,
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(
  morgan("combined", {
    stream: { write: (message) => logger.info(message.trim()) },
  }),
);

// Documents d'adhésion / certificats médicaux uploadés (voir
// middlewares/upload.js) — servis en statique comme le fait le monolithe
// pour `uploads/avatars`. Le monolithe relaie `/uploads/adhesions` et
// `/uploads/certificats` ici via `proxyTo` (motif "strangler fig").
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
  max: process.env.RATE_LIMIT_MAX || 200,
  message: {
    success: false,
    message: "Trop de requêtes, veuillez réessayer plus tard",
  },
});
app.use("/api", limiter);

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    service: "vie-associative-service",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.use("/api", routes);

app.use(ErrorHandler.notFound);
app.use(ErrorHandler.handle);

const initializeApp = async () => {
  const connected = await testConnection();
  if (!connected) {
    logger.error("❌ [vie-associative-service] Database connection failed");
    process.exit(1);
  }

  // Alertes d'expiration (adhésion / certificat médical à J-30) : un premier
  // passage immédiat au démarrage, puis tous les jours à 6h — motif identique
  // à celui du monolithe avant que ce domaine n'en soit extrait.
  const alerteService = new AlerteService();
  await alerteService.syncExpirationAlertes();
  cron.schedule("0 6 * * *", () => alerteService.syncExpirationAlertes());
  logger.info("✅ Planification des alertes d'expiration active (quotidien 06:00)");
};

process.on("unhandledRejection", (err) => {
  logger.error("Unhandled Rejection:", err);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception:", err);
  process.exit(1);
});

module.exports = { app, initializeApp, sequelize };
