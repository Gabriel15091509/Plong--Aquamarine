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

// Indispensable derrière le reverse proxy de Render (et le relais interne
// du gateway-service qui, lui, transmet le X-Forwarded-For d'origine sans
// le modifier) : sans ça, req.ip retombe sur l'IP du proxy pour TOUTES
// les requêtes au lieu de lire X-Forwarded-For, donc express-rate-limit
// (plus bas) compte tous les appelants dans un seul et même compteur
// global au lieu d'un compteur par vrai client. `1` = on ne fait
// confiance qu'au premier hop devant nous.
app.set("trust proxy", 1);

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

// Nouvelle valeur d'ENUM, idempotente (ADD VALUE IF NOT EXISTS), appliquée
// automatiquement au démarrage plutôt qu'à la main via psql — même motif que
// identite-service/src/app.js et activites-service/src/app.js:
// runPendingMigrations (incident du 2026-08-24 : une valeur ajoutée au
// modèle avant que la migration soit appliquée en base avait cassé une
// fonctionnalité pour tout le monde). Les deux valeurs précédentes
// ("Materiel en retard"/"Inactivite plongee", voir scripts/migrate-alerte-
// nouveaux-types.sql) avaient été appliquées à la main — script conservé
// pour l'historique, mais toute nouvelle valeur passe désormais par ici.
// N'échoue jamais le démarrage : une erreur ici laisse la fonctionnalité
// concernée indisponible plutôt que de bloquer tout le service.
//
// Type explicitement qualifié par le schéma : vérifié en pratique (script
// de vérification ad hoc) qu'un `enum_alertes_type` existe À LA FOIS dans
// `public` ET dans le schéma applicatif — un ALTER TYPE non qualifié résout
// via search_path et tombe sur celui de `public` (jamais utilisé par la
// table réelle), laissant le bon type inchangé : la migration se dit
// "appliquée" sans rien avoir corrigé, et toute création d'alerte "Sortie
// modifiée" échoue ensuite avec "invalid input value for enum". Qualifier
// explicitement élimine cette ambiguïté.
const runPendingMigrations = async () => {
  const schema = process.env.DB_SCHEMA || "vie_associative";
  try {
    await sequelize.query(
      `ALTER TYPE ${schema}.enum_alertes_type ADD VALUE IF NOT EXISTS 'Sortie modifiée'`,
    );
    logger.info("[vie-associative-service] Migration type d'alerte 'Sortie modifiée' vérifiée/appliquée");
  } catch (error) {
    logger.error("[vie-associative-service] Échec migration type d'alerte 'Sortie modifiée' :", error);
  }

  // Verso du document d'adhésion (recto/verso) — voir models/Adhesion.js.
  // Colonne nullable, sans effet sur les lignes existantes (document
  // recto seul déjà en place, jamais retraité).
  try {
    await sequelize.query(
      `ALTER TABLE ${schema}.adhesions ADD COLUMN IF NOT EXISTS document_path_verso VARCHAR(255)`,
    );
    logger.info("[vie-associative-service] Migration document_path_verso (adhesions) vérifiée/appliquée");
  } catch (error) {
    logger.error("[vie-associative-service] Échec migration document_path_verso (adhesions) :", error);
  }
};

const initializeApp = async () => {
  const connected = await testConnection();
  if (!connected) {
    logger.error("[vie-associative-service] Database connection failed");
    process.exit(1);
  }
  await runPendingMigrations();
};

// Jobs de fond : volontairement séparés de initializeApp() et jamais
// attendus avant app.listen() (voir server.js). Même précaution que le
// correctif du 22/08/2026 sur finance-service (incident réel : un envoi
// email bloquant au démarrage a empêché finance-service de seulement
// commencer à écouter, /health injoignable indéfiniment) — ces jobs-ci
// n'envoient pas d'email eux-mêmes aujourd'hui, mais le motif est
// identique et un futur envoi ajouté ici ne doit jamais pouvoir bloquer
// le démarrage. Chaque appel est catché individuellement plutôt que de
// laisser une rejection non gérée déclencher process.exit(1) via le
// handler unhandledRejection plus bas.
const startBackgroundJobs = () => {
  // Alertes d'expiration (adhésion / certificat médical à J-30) : un premier
  // passage immédiat au démarrage, puis tous les jours à 6h — motif identique
  // à celui du monolithe avant que ce domaine n'en soit extrait.
  const alerteService = new AlerteService();
  const runSyncExpirationAlertes = () =>
    alerteService
      .syncExpirationAlertes()
      .catch((err) => logger.error("Échec de la synchro des alertes d'expiration :", err));
  runSyncExpirationAlertes();
  cron.schedule("0 6 * * *", runSyncExpirationAlertes);
  logger.info("Planification des alertes d'expiration active (quotidien 06:00)");

  // Auto-expiration des certificats médicaux : `statut` est saisi
  // manuellement (par le moniteur/président) et ne se corrige jamais tout
  // seul sinon — un certificat dont la date de validité est dépassée mais
  // resté "Valide" en base est corrigé ici, en plus de la correction
  // dynamique faite à la lecture (CertificatMedicalService.deriveStatut).
  const certificatMedicalService = new CertificatMedicalService();
  const runExpireOverdueCertificates = () =>
    certificatMedicalService
      .expireOverdueCertificates()
      .then((nbExpires) => {
        if (nbExpires > 0) {
          logger.info(`${nbExpires} certificat(s) médical(aux) marqué(s) "Expiré" (date de validité dépassée)`);
        }
      })
      .catch((err) => logger.error("Échec de l'auto-expiration des certificats médicaux :", err));
  runExpireOverdueCertificates();
  cron.schedule("5 6 * * *", runExpireOverdueCertificates);
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

module.exports = { app, initializeApp, startBackgroundJobs, sequelize };
