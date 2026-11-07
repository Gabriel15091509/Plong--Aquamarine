const crypto = require("node:crypto");

const SESSION_COOKIE = "__Host-aquanature_session";
const CSRF_COOKIE = "__Host-aquanature_csrf";
const COOKIE_OPTIONS = { httpOnly: true, secure: true, sameSite: "strict", path: "/" };
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function readCookie(req, name) {
  const entries = (req.headers.cookie || "").split(";");
  const values = entries.map((entry) => entry.trim()).filter((entry) => entry.startsWith(`${name}=`));
  // Duplicate security cookies are ambiguous: fail closed.
  if (values.length !== 1) return null;
  try { return decodeURIComponent(values[0].slice(name.length + 1)); } catch { return null; }
}

function csrfFor(value) {
  return crypto.createHmac("sha256", process.env.JWT_SECRET).update(`browser-csrf:${value}`).digest("hex");
}

function csrfMatches(value, supplied) {
  if (!value || typeof supplied !== "string" || !/^[a-f0-9]{64}$/.test(supplied)) return false;
  return crypto.timingSafeEqual(Buffer.from(csrfFor(value), "hex"), Buffer.from(supplied, "hex"));
}

function browserSession(req, res, next) {
  const token = readCookie(req, SESSION_COOKIE);
  req.browserSession = Boolean(token || req.headers["x-auth-transport"] === "cookie");
  if (!req.browserSession) return next(); // Native mobile and internal Bearer clients.
  res.set("Cache-Control", "no-store");
  if (!SAFE_METHODS.has(req.method)) {
    const binding = token || readCookie(req, CSRF_COOKIE);
    if (!csrfMatches(binding, req.headers["x-csrf-token"])) {
      return res.status(403).json({ success: false, code: "CSRF_INVALID", message: "Session de sécurité expirée. Réessayez." });
    }
  }
  // Existing authorization and service-to-service calls continue to use Bearer.
  if (token) req.headers.authorization = `Bearer ${token}`;
  next();
}

function bootstrapCsrf(req, res) {
  let binding = readCookie(req, SESSION_COOKIE) || readCookie(req, CSRF_COOKIE);
  if (!binding) {
    binding = crypto.randomBytes(32).toString("hex");
    res.cookie(CSRF_COOKIE, binding, { ...COOKIE_OPTIONS, maxAge: 60 * 60 * 1000 });
  }
  res.set("Cache-Control", "no-store");
  return res.json({ success: true, data: { csrfToken: csrfFor(binding) } });
}

function authResponse(req, res, data) {
  if (!req.browserSession) return data;
  const { token, ...publicData } = data;
  const { exp } = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
  res.cookie(SESSION_COOKIE, token, { ...COOKIE_OPTIONS, maxAge: Math.max(0, exp * 1000 - Date.now()) });
  res.clearCookie(CSRF_COOKIE, COOKIE_OPTIONS);
  res.set("Cache-Control", "no-store");
  return { ...publicData, csrfToken: csrfFor(token) };
}

function clearSession(req, res) {
  res.clearCookie(SESSION_COOKIE, COOKIE_OPTIONS);
  res.clearCookie(CSRF_COOKIE, COOKIE_OPTIONS);
  res.set("Cache-Control", "no-store");
  return res.json({ success: true });
}

module.exports = { browserSession, bootstrapCsrf, authResponse, clearSession, readCookie, csrfFor, SESSION_COOKIE, CSRF_COOKIE };
