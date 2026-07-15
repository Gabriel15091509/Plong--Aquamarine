const logger = require("../utils/logger");

class ErrorHandler {
  static handle(error, req, res, _next) {
    logger.error({
      message: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method,
      ip: req.ip,
    });

    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        success: false,
        message: "Erreur de validation",
        errors: error.errors.map((e) => e.message),
      });
    }

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        success: false,
        message: "Violation de contrainte d'unicité",
        errors: error.errors.map((e) => e.message),
      });
    }

    if (error.name === "SequelizeForeignKeyConstraintError") {
      return res.status(400).json({
        success: false,
        message: "Violation de contrainte de clé étrangère",
        errors: [error.message],
      });
    }

    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token invalide ou expiré",
      });
    }

    const status = error.status || 500;
    const message = error.message || "Une erreur interne est survenue";

    res.status(status).json({
      success: false,
      message,
      ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    });
  }

  static notFound(req, res) {
    res.status(404).json({
      success: false,
      message: "Route non trouvée",
    });
  }
}

module.exports = ErrorHandler;
