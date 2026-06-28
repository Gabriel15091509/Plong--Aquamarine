const authorize = (permissions = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Non authentifié",
      });
    }

    // ✅ Vérifier que req.user a la méthode hasPermission
    if (typeof req.user.hasPermission !== "function") {
      // Si la méthode n'existe pas, on utilise une vérification basique
      const hasAllPermissions = req.user.role === "president";

      // Vérifier si l'utilisateur a toutes les permissions ou une permission spécifique
      const hasPermission = permissions.some((permission) => {
        // Si l'utilisateur est président, il a toutes les permissions
        if (hasAllPermissions) return true;

        // Vérification basique par rôle
        const rolePermissions = {
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

    // ✅ Vérifier les permissions avec la méthode hasPermission
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
