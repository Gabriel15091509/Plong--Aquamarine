const authorize = (permissions = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      });
    }

    // Vérifier les permissions
    const hasPermission = permissions.some(permission => 
      req.user.hasPermission(permission)
    );

    if (!hasPermission && !req.user.hasPermission('all')) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé - permissions insuffisantes'
      });
    }

    next();
  };
};

module.exports = authorize;