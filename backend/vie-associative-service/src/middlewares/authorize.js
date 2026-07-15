const authorize = (permissions = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Non authentifié",
      });
    }

    if (typeof req.user.hasPermission !== "function") {
      const hasAllPermissions = req.user.role === "president";

      const hasPermission = permissions.some((permission) => {
        if (hasAllPermissions) return true;

        const rolePermissions = {
          president: ["all"],
          moniteur: ["manage_formations", "view_adherents"],
          adherent: ["view_profile"],
          tresorier: ["manage_paiements", "view_adherents"],
        };

        const userPermissions = rolePermissions[req.user.role] || [];
        return (
          userPermissions.includes("all") ||
          userPermissions.includes(permission)
        );
      });

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: "Accès refusé - permissions insuffisantes",
        });
      }

      return next();
    }

    const hasPermission = permissions.some((permission) =>
      req.user.hasPermission(permission),
    );

    if (!hasPermission && !req.user.hasPermission("all")) {
      return res.status(403).json({
        success: false,
        message: "Accès refusé - permissions insuffisantes",
      });
    }

    next();
  };
};

module.exports = authorize;
