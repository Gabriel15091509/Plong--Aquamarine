const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const path = require("path");
require("dotenv").config();

// Import modules
const routes = require("./routes");
const ErrorHandler = require("./middlewares/errorHandler");
const logger = require("./utils/logger");
const {
  sequelize,
  testConnection,
  syncDatabase,
} = require("./config/database");

const app = express();

// ========== MIDDLEWARES ==========

// Security
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

// CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }),
);

// Body parser
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Static files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Logging
app.use(
  morgan("combined", {
    stream: { write: (message) => logger.info(message.trim()) },
  }),
);

// Rate limiting
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
  max: process.env.RATE_LIMIT_MAX || 100,
  message: {
    success: false,
    message: "Trop de requêtes, veuillez réessayer plus tard",
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
  });
});

// API routes
app.use("/api", routes);

// ========== ERROR HANDLING ==========

// 404 handler
app.use(ErrorHandler.notFound);

// Global error handler
app.use(ErrorHandler.handle);

// ========== DATABASE CONNECTION ==========

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
