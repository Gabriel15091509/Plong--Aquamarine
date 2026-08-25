const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const cron = require("node-cron");
const client = require("prom-client");
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
    service: "activites-service",
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
    logger.error("[activites-service] Database connection failed");
    process.exit(1);
  }
};

// Jobs de fond : volontairement séparés de initializeApp() et jamais
// attendus avant app.listen() (voir server.js). Correctif du 22/08/2026
// (incident réel sur finance-service, même motif copié-collé ici : un
// envoi email bloquant au démarrage a empêché le service de seulement
// commencer à écouter, /health injoignable indéfiniment). C'est ici le
// service le plus exposé : envoyerRappels envoie des emails/SMS, et
// verifierMeteoEtAnnulerSiDangereux appelle une API météo externe — deux
// dépendances réseau de plus qui peuvent traîner ou ne jamais répondre.
// Chaque appel est catché individuellement plutôt que de laisser une
// rejection non gérée déclencher process.exit(1) via le handler
// unhandledRejection plus bas.
const startBackgroundJobs = () => {
  // Alertes "prêt en retard" (3.4.4) et "inactivité carnet de plongée"
  // (3.3.2) : un premier passage immédiat au démarrage, puis tous les jours
  // à 7h — motif identique aux alertes d'expiration de vie-associative-service.
  const attributionService = new AttributionService();
  const plongeeService = new PlongeeService();
  const runAlerterRetards = () =>
    attributionService
      .alerterRetards()
      .catch((err) => logger.error("Échec de l'alerte prêts en retard :", err));
  const runAlerterInactifs = () =>
    plongeeService
      .alerterInactifs()
      .catch((err) => logger.error("Échec de l'alerte inactivité carnet :", err));
  runAlerterRetards();
  runAlerterInactifs();
  cron.schedule("0 7 * * *", runAlerterRetards);
  cron.schedule("0 7 * * *", runAlerterInactifs);
  logger.info("Planification des alertes matériel/plongée active (quotidien 07:00)");

  // Passage automatique "Planifiée" -> "En cours" à l'heure de départ : un
  // premier passage immédiat au démarrage, puis toutes les 5 minutes (les
  // autres jobs de ce fichier sont quotidiens, mais celui-ci doit réagir
  // dans les minutes qui suivent l'heure réelle de la sortie, pas une fois
  // par jour).
  const sortieService = new SortieService();
  const runDemarrerSortiesEchues = () =>
    sortieService
      .demarrerSortiesEchues()
      .then((nbDemarrees) => {
        if (nbDemarrees > 0) {
          logger.info(`${nbDemarrees} sortie(s) passée(s) "En cours" (heure de départ atteinte)`);
        }
      })
      .catch((err) => logger.error("Échec du passage automatique à \"En cours\" :", err));
  runDemarrerSortiesEchues();
  cron.schedule("*/5 * * * *", runDemarrerSortiesEchues);
  logger.info("Passage automatique des sorties à \"En cours\" actif (toutes les 5 minutes)");

  // Rappel 24h avant sortie (3.2.2) : un premier passage immédiat au
  // démarrage, puis tous les jours à 18h.
  const runEnvoyerRappels = () =>
    sortieService
      .envoyerRappels(getSystemAuthHeader())
      .catch((err) => logger.error("Échec des rappels de sortie :", err));
  runEnvoyerRappels();
  cron.schedule("0 18 * * *", runEnvoyerRappels);
  logger.info("Planification des rappels de sortie active (quotidien 18:00)");

  // Vérification météo en deux phases sur les sorties Planifiée localisées
  // (vent, houle, orage, fortes précipitations) : 3 tests sur 3 jours
  // différents (nominalement J-5, J-4, J-3) avec décision automatique après
  // le 3e (annule si au moins un des 3 a détecté un danger), puis re-test à
  // J-1 en simple alerte (jamais d'annulation automatique à ce stade —
  // décision humaine). Un premier passage immédiat au démarrage, puis tous
  // les jours à 6h (avant la préparation matérielle habituelle) — voir
  // SortieService.verifierMeteoEtAnnulerSiDangereux.
  const runVerifierMeteo = () =>
    sortieService
      .verifierMeteoEtAnnulerSiDangereux(getSystemAuthHeader())
      .catch((err) => logger.error("Échec de la vérification météo :", err));
  runVerifierMeteo();
  cron.schedule("0 6 * * *", runVerifierMeteo);
  logger.info("Planification de la vérification météo active (quotidien 06:00)");

  // Alerte (jamais d'annulation automatique) à l'organisateur d'une sortie
  // encore sans aucune inscription à 3 jours de la date — décision humaine,
  // voir SortieService.alerterSortiesSansInscription. Un premier passage
  // immédiat au démarrage, puis tous les jours à 8h.
  const runAlerterSortiesSansInscription = () =>
    sortieService
      .alerterSortiesSansInscription()
      .catch((err) => logger.error("Échec de l'alerte sorties sans inscription :", err));
  runAlerterSortiesSansInscription();
  cron.schedule("0 8 * * *", runAlerterSortiesSansInscription);
  logger.info("Planification de l'alerte sortie sans inscription active (quotidien 08:00)");
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
