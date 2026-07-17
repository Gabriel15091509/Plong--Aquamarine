const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const cron = require("node-cron");
require("dotenv").config();

const routes = require("./routes");
const ErrorHandler = require("./middlewares/errorHandler");
const logger = require("./utils/logger");
const AttributionService = require("./services/AttributionService");
const PlongeeService = require("./services/PlongeeService");
const SortieService = require("./services/SortieService");
const { getSystemAuthHeader } = require("./utils/internalAuth");
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
    service: "activites-service",
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
    logger.error("❌ [activites-service] Database connection failed");
    process.exit(1);
  }

  // Alertes "prêt en retard" (3.4.4) et "inactivité carnet de plongée"
  // (3.3.2) : un premier passage immédiat au démarrage, puis tous les jours
  // à 7h — motif identique aux alertes d'expiration de vie-associative-service.
  const attributionService = new AttributionService();
  const plongeeService = new PlongeeService();
  await attributionService.alerterRetards();
  await plongeeService.alerterInactifs();
  cron.schedule("0 7 * * *", () => attributionService.alerterRetards());
  cron.schedule("0 7 * * *", () => plongeeService.alerterInactifs());
  logger.info("✅ Planification des alertes matériel/plongée active (quotidien 07:00)");

  // Rappel 24h avant sortie (3.2.2) : un premier passage immédiat au
  // démarrage, puis tous les jours à 18h.
  const sortieService = new SortieService();
  const systemAuthHeader = getSystemAuthHeader();
  await sortieService.envoyerRappels(systemAuthHeader);
  cron.schedule("0 18 * * *", () => sortieService.envoyerRappels(getSystemAuthHeader()));
  logger.info("✅ Planification des rappels de sortie active (quotidien 18:00)");
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
