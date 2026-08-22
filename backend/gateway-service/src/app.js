const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const client = require("prom-client");
require("dotenv").config();

// Import modules
const routes = require("./routes");
const ErrorHandler = require("./middlewares/errorHandler");
const logger = require("./utils/logger");
const { testConnection, syncDatabase } = require("./config/database");

const app = express();

// Indispensable derrière le reverse proxy de Render (et tout hébergeur
// PaaS équivalent) : sans ça, req.ip retombe sur l'IP du proxy pour
// TOUTES les requêtes au lieu de lire X-Forwarded-For, donc express-rate-
// limit (plus bas) compte tous les visiteurs du site dans un seul et
// même compteur global au lieu d'un compteur par vrai client. `1` = on
// ne fait confiance qu'au premier hop devant nous (le load balancer
// Render), pas à une chaîne de proxies arbitraire.
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

// CORS - Configuration SIMPLIFIÉE pour accepter TOUTES les origines
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
const MATERIEL_SERVICE_URL =
  process.env.MATERIEL_SERVICE_URL || "http://localhost:5011";
app.use("/uploads/adhesions", proxyTo(VIE_ASSOCIATIVE_SERVICE_URL));
app.use("/uploads/certificats", proxyTo(VIE_ASSOCIATIVE_SERVICE_URL));
app.use("/uploads/avatars", proxyTo(IDENTITE_SERVICE_URL));
app.use("/uploads/materiels", proxyTo(MATERIEL_SERVICE_URL));

// Logging
app.use(
  morgan("combined", {
    stream: { write: (message) => logger.info(message.trim()) },
  }),
);

// Rate limiting - Moins restrictif pour le mobile
// 1000/15min : une SPA avec React Query peut facilement déclencher plusieurs
// dizaines de requêtes parallèles par page (dashboard agrégé, listes avec
// résolution de noms croisée...), et plusieurs adhérents du club partagent
// souvent la même IP (routeur du club/maison) - l'ancienne valeur (200,
// parfois 100 en local) provoquait des 429 en usage normal, pas seulement
// en cas d'abus.
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
  max: process.env.RATE_LIMIT_MAX || 1000,
  message: {
    success: false,
    message: "Trop de requêtes, veuillez réessayer plus tard",
  },
  skip: (req) => {
    // Hors production : une session de dev/test (rechargements, plusieurs
    // services qui se retestent l'un l'autre, React Query qui reparallélise
    // au moindre remount) épuise les 1000/15min en quelques minutes sans
    // qu'il y ait le moindre abus - le rate limiting n'a de sens qu'en prod,
    // où trafic public + brute-force sont de vrais risques.
    if (process.env.NODE_ENV !== "production") return true;
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

app.get("/metrics", async (req, res) => {
  res.set("Content-Type", metricsRegister.contentType);
  res.end(await metricsRegister.metrics());
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
      logger.error("Database connection failed");
      process.exit(1);
    }

    // Sync database in development
    if (process.env.NODE_ENV === "development") {
      await syncDatabase({ alter: true });
      logger.info("Database synchronized");
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

    logger.info(`Server running on port ${PORT}`);
    logger.info(`Connect mobile app to:`);
    ipAddresses.forEach((ip) => {
      logger.info(`   http://${ip}:${PORT}/api`);
    });
    logger.info(`   Android Emulator: http://10.0.2.2:${PORT}/api`);
    logger.info(`   iOS Simulator: http://localhost:${PORT}/api`);
    logger.info(`   Local: http://localhost:${PORT}/api`);
    logger.info(``);
    logger.info(`Health check: http://localhost:${PORT}/health`);

    // DÉMARRER LE SERVEUR SUR TOUTES LES INTERFACES
    app.listen(PORT, "0.0.0.0", () => {
      logger.info(`Server is listening on all interfaces (0.0.0.0:${PORT})`);
      logger.info(
        `Your mobile can connect using: http://${ipAddresses[0] || "your-ip"}:${PORT}/api`,
      );
    });

    logger.info("Application initialized successfully");
  } catch (error) {
    logger.error("Application initialization failed:", error);
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
