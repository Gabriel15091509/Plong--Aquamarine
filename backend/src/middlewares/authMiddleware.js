const jwt = require("jsonwebtoken");

class AuthMiddleware {
  static authenticate(req, res, next) {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        return res.status(401).json({
          success: false,
          message: "Token non fourni",
        });
      }

      const token = authHeader.split(" ")[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Token non fourni",
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      if (error.name === "JsonWebTokenError") {
        return res.status(401).json({
          success: false,
          message: "Token invalide",
        });
      }
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Token expiré",
        });
      }

      return res.status(401).json({
        success: false,
        message: "Erreur d'authentification",
      });
    }
  }

  static authorize(roles = []) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Non authentifié",
        });
      }

      // Si aucun rôle n'est spécifié, tout le monde peut passer
      if (roles.length === 0) {
        return next();
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: "Accès refusé - droits insuffisants",
        });
      }

      next();
    };
  }
}

module.exports = AuthMiddleware;
