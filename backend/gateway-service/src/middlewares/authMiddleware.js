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

      // ✅ Ajouter l'utilisateur avec la méthode hasPermission
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        name: decoded.name,
        // ✅ Ajouter la méthode hasPermission
        hasPermission: function (permission) {
          const permissions = {
            president: [
              "all",
              "manage_users",
              "manage_staff",
              "view_stats",
              "manage_settings",
              "manage_sorties",
              "validate_plongees",
              "manage_formations",
              "view_adherents",
              "manage_paiements",
              "exports",
              "change_niveau",
              "change_role",
              "disable_account",
              "delete_account",
              "reset_password",
            ],
            moniteur: [
              "manage_sorties",
              "validate_plongees",
              "manage_formations",
              "view_adherents",
              "view_profile",
              "inscription_sorties",
              "view_carnet",
            ],
            adherent: ["view_profile", "inscription_sorties", "view_carnet"],
            tresorier: [
              "manage_paiements",
              "view_stats",
              "exports",
              "view_adherents",
              "view_profile",
            ],
          };

          const userPermissions = permissions[this.role] || [];
          return (
            userPermissions.includes("all") ||
            userPermissions.includes(permission)
          );
        },
      };

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
