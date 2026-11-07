const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const path = require("path");
const client = require("prom-client");
const cron = require("node-cron");
require("dotenv").config();

const routes = require("./routes");
const ErrorHandler = require("./middlewares/errorHandler");
const logger = require("./utils/logger");
const { sequelize, testConnection } = require("./config/database");
const BackupService = require("./services/BackupService");

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
    contentSecurityPolicy: require("../../shared/securityPolicy").helmetOptions.contentSecurityPolicy,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
  }),
);

app.use(
  cors({
    origin: require("../../shared/securityPolicy").corsOptions.origin,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Auth-Transport",
      "X-CSRF-Token",
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

// Photos de profil (tous rôles) — voir middlewares/upload.js.
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
    service: "identite-service",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get("/metrics", async (req, res) => {
  res.set("Content-Type", metricsRegister.contentType);
  res.end(await metricsRegister.metrics());
});

app.use("/api", require("../../shared/browserSession").browserSession);
app.use("/api", require("../../shared/apiAccess").apiAccess(require("./middlewares/authMiddleware").authenticate));
app.use("/api", routes);

app.use(ErrorHandler.notFound);
app.use(ErrorHandler.handle);

// Migrations additives légères, idempotentes (ADD COLUMN IF NOT EXISTS
// uniquement — jamais de DROP/RENAME ici), appliquées automatiquement au
// démarrage plutôt qu'à la main via psql : l'accès externe à la base
// Render est bloqué par défaut (pas d'IP autorisée dans "Networking"),
// donc un script scripts/migrate-*.sql laissé à exécuter manuellement
// peut rester en attente indéfiniment — incident du 2026-08-24 (voir
// git log autour de a4aee1a/9501ebe : reset_token_hash/reset_token_expires_at
// avaient été ajoutées au modèle User avant que la migration soit
// appliquée, cassant le login pour tout le monde). N'échoue jamais le
// démarrage : une erreur ici laisse la fonctionnalité concernée
// indisponible plutôt que de bloquer tout le service.
const runPendingMigrations = async () => {
  const schema = process.env.DB_SCHEMA || "identite";
  try {
    await sequelize.query(
      `ALTER TABLE ${schema}.users ADD COLUMN IF NOT EXISTS reset_token_hash VARCHAR(255)`,
    );
    await sequelize.query(
      `ALTER TABLE ${schema}.users ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMPTZ`,
    );
    logger.info("[identite-service] Migration reset_token_* vérifiée/appliquée");
  } catch (error) {
    logger.error("[identite-service] Échec migration reset_token_* :", error);
  }

  // Sauvegarde/restauration de la base (voir BackupService, ParametresPage.jsx
  // côté frontend) : schéma + table dédiés, additifs et idempotents comme la
  // migration ci-dessus — jamais de DROP/RENAME. Dans un try/catch séparé
  // pour qu'un échec ici n'empêche pas la migration reset_token_* (et
  // inversement) de s'appliquer.
  try {
    await sequelize.query(`CREATE SCHEMA IF NOT EXISTS backup`);
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS backup.snapshots (
        id SERIAL PRIMARY KEY,
        type VARCHAR(20) NOT NULL,
        taille_octets BIGINT NOT NULL,
        contenu JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    logger.info("[identite-service] Schéma/table backup.snapshots vérifié(e)/créé(e)");
  } catch (error) {
    logger.error("[identite-service] Échec migration backup.snapshots :", error);
  }

  // Disponibilité ponctuelle d'un moniteur (toggle + motif) — voir
  // models/Moniteur.js. Bloc séparé des deux précédents (même raisonnement :
  // un échec ici ne doit pas empêcher les autres migrations de s'appliquer).
  try {
    await sequelize.query(
      `ALTER TABLE ${schema}.moniteurs ADD COLUMN IF NOT EXISTS disponible BOOLEAN NOT NULL DEFAULT true`,
    );
    await sequelize.query(
      `ALTER TABLE ${schema}.moniteurs ADD COLUMN IF NOT EXISTS cause_indisponibilite TEXT`,
    );
    logger.info(
      "[identite-service] Migration moniteurs.disponible/cause_indisponibilite vérifiée/appliquée",
    );
  } catch (error) {
    logger.error(
      "[identite-service] Échec migration moniteurs.disponible/cause_indisponibilite :",
      error,
    );
  }
};

const initializeApp = async () => {
  const connected = await testConnection();
  if (!connected) {
    logger.error("[identite-service] Database connection failed");
    process.exit(1);
  }
  await runPendingMigrations();
  // Fail closed if persistent session validation cannot be initialized.
  await sequelize.query("CREATE SCHEMA IF NOT EXISTS security");
  await require("./models/AuthSession").sync();
};

// Sauvegarde automatique quotidienne (voir BackupService.creer) : démarrée
// seulement APRÈS que le serveur écoute déjà (voir server.js, même motif
// qu'activites-service/src/app.js) — jamais au boot lui-même, ni immédiate
// à l'appel comme les autres jobs de ce dépôt : un instantané complet de
// toute la base est plus lourd qu'une simple requête d'alerte, et le
// rejouer à chaque redémarrage/redéploiement (fréquents sur le plan
// gratuit Render) empilerait des sauvegardes quasi identiques pour rien.
const startBackgroundJobs = () => {
  const backupService = new BackupService();
  const runSauvegardeAutomatique = () =>
    backupService
      .creer("automatique")
      .then((snapshot) =>
        logger.info(
          `[identite-service] Sauvegarde automatique créée (id ${snapshot.id}, ${snapshot.taille_octets} octets)`,
        ),
      )
      .catch((err) =>
        logger.error("[identite-service] Échec de la sauvegarde automatique :", err),
      );
  cron.schedule("55 23 * * *", runSauvegardeAutomatique);
  logger.info("[identite-service] Sauvegarde automatique quotidienne planifiée (23:55)");
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
