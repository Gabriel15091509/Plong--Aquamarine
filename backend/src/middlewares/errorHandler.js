const logger = require('../utils/logger');

class ErrorHandler {
  static handle(error, req, res, next) {
    // Log error
    logger.error({
      message: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method,
      ip: req.ip
    });

    // Sequelize validation error
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation',
        errors: error.errors.map(e => e.message)
      });
    }

    // Sequelize unique constraint error
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Violation de contrainte d\'unicité',
        errors: error.errors.map(e => e.message)
      });
    }

    // Sequelize foreign key constraint error
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Violation de contrainte de clé étrangère',
        errors: [error.message]
      });
    }

    // JWT error
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token invalide ou expiré'
      });
    }

    // Default error
    const status = error.status || 500;
    const message = error.message || 'Une erreur interne est survenue';

    res.status(status).json({
      success: false,
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }

  static notFound(req, res) {
    res.status(404).json({
      success: false,
      message: 'Route non trouvée'
    });
  }
}

module.exports = ErrorHandler;