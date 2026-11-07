const PUBLIC = new Set([
  "GET /auth/csrf", "POST /auth/login", "POST /auth/verify-otp",
  "POST /auth/forgot-password", "POST /auth/reset-password", "POST /auth/logout",
  "POST /auth/introspect",
]);
function apiAccess(authenticate) {
  return (req, res, next) => {
    const path = req.path.replace(/\/$/, "") || "/";
    if (PUBLIC.has(`${req.method} ${path}`)) return next();
    return authenticate(req, res, () => {
      if (req.user.must_change_password && !["/auth/session", "/auth/change-password"].includes(path)) {
        return res.status(403).json({ success: false, code: "PASSWORD_CHANGE_REQUIRED", message: "Veuillez changer votre mot de passe avant de continuer" });
      }
      next();
    });
  };
}
function selfOrStaff(req, res, next) {
  if (Number(req.params.user_id) === req.user.id || ["president", "moniteur", "tresorier"].includes(req.user.role)) return next();
  return res.status(403).json({ success: false, message: "Accès refusé à ce profil" });
}
module.exports = { apiAccess, selfOrStaff };
