const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const path = require("path");
const cron = require("node-cron");
const client = require("prom-client");
require("dotenv").config();

const routes = require("./routes");
const ErrorHandler = require("./middlewares/errorHandler");
const logger = require("./utils/logger");
const AlerteService = require("./services/AlerteService");
const CertificatMedicalService = require("./services/CertificatMedicalService");
const { sequelize, testConnection } = require("./config/database");

const app = express();

// Métriques Prometheus (Phase 5) : un registre par process, séparé du
// registre global de prom-client pour éviter toute collision si ce
// module était un jour importé plusieurs fois (tests, notamment).
const metricsRegister = new client.Registry();
client.collectDefaultMetrics({ register: metricsRegister });

const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Durée des requêtes HTTP entrantes, en secondes",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [metricsRegister],
});

// Posé en tout premier middleware pour mesurer la requête de bout en
// bout (y compris parsing du body, rate-limit, etc.). `req.route?.path`
// n'est peuplé qu'une fois la route effectivement matchée par Express —
// on retombe sur `req.path` sinon (404, requêtes non matchées).
app.use((req, res, next) => {
  const endTimer = httpRequestDuration.startTimer();
  res.on("finish", () => {
    endTimer({
      method: req.method,
      route: req.route?.path || req.path,
      status_code: res.statusCode,
    });
  });
  next();
});

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
  max: process.env.RATE_LIMIT_MAX || 1000,
  message: {
    success: false,
    message: "Trop de requêtes, veuillez réessayer plus tard",
  },
  // Hors production : voir gateway-service/src/app.js pour le raisonnement
  // (le rate limiting global n'a de sens que face à un vrai trafic public).
  skip: () => process.env.NODE_ENV !== "production",
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

app.get("/metrics", async (req, res) => {
  res.set("Content-Type", metricsRegister.contentType);
  res.end(await metricsRegister.metrics());
});

app.use("/api", routes);

app.use(ErrorHandler.notFound);
app.use(ErrorHandler.handle);

const initializeApp = async () => {
  const connected = await testConnection();
  if (!connected) {
    logger.error("[vie-associative-service] Database connection failed");
    process.exit(1);
  }

  // Alertes d'expiration (adhésion / certificat médical à J-30) : un premier
  // passage immédiat au démarrage, puis tous les jours à 6h — motif identique
  // à celui du monolithe avant que ce domaine n'en soit extrait.
  const alerteService = new AlerteService();
  await alerteService.syncExpirationAlertes();
  cron.schedule("0 6 * * *", () => alerteService.syncExpirationAlertes());
  logger.info("Planification des alertes d'expiration active (quotidien 06:00)");

  // Auto-expiration des certificats médicaux : `statut` est saisi
  // manuellement (par le moniteur/président) et ne se corrige jamais tout
  // seul sinon — un certificat dont la date de validité est dépassée mais
  // resté "Valide" en base est corrigé ici, en plus de la correction
  // dynamique faite à la lecture (CertificatMedicalService.deriveStatut).
  const certificatMedicalService = new CertificatMedicalService();
  const nbExpires = await certificatMedicalService.expireOverdueCertificates();
  if (nbExpires > 0) {
    logger.info(`${nbExpires} certificat(s) médical(aux) marqué(s) "Expiré" (date de validité dépassée)`);
  }
  cron.schedule("5 6 * * *", () => certificatMedicalService.expireOverdueCertificates());
  logger.info("Auto-expiration des certificats médicaux active (quotidien 06:05)");
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
