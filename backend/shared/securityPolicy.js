const os = require("node:os");

function allowedOrigins() {
  const configured = [process.env.CORS_ORIGIN, process.env.FRONTEND_URL].filter(Boolean).flatMap((value) => value.split(",")).map((value) => value.trim()).filter((value) => value && value !== "*");
  const origins = new Set(configured.map((value) => new URL(value).origin));
  if (process.env.NODE_ENV !== "production") {
    const hosts = ["localhost", "127.0.0.1", "[::1]", ...Object.values(os.networkInterfaces()).flat().filter((item) => item?.family === "IPv4").map((item) => item.address)];
    for (const host of hosts) for (const protocol of ["https", "http"]) origins.add(`${protocol}://${host}:3000`);
  }
  return origins;
}
const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins().has(origin)) return callback(null, true);
    const error = new Error("Origine non autorisée");
    error.status = 403;
    callback(error);
  },
  credentials: true,
  methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-Auth-Transport", "X-CSRF-Token", "Accept"],
};
function cspDirectives(development = false) {
  return {
    "default-src": ["'self'"], "base-uri": ["'self'"], "object-src": ["'none'"],
    "frame-ancestors": ["'none'"], "form-action": ["'self'"],
    // Vite's React refresh preamble is inline in development only.
    "script-src": ["'self'", "'wasm-unsafe-eval'", ...(development ? ["'unsafe-inline'"] : [])],
    "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    "img-src": ["'self'", "data:", "blob:", "https:"],
    "font-src": ["'self'", "data:", "https://fonts.gstatic.com"],
    "connect-src": ["'self'", "https://nominatim.openstreetmap.org", "https://router.project-osrm.org", ...(development ? ["wss:", "ws:"] : [])],
    "media-src": ["'self'", "blob:", "https://cdn.pixabay.com"],
    "worker-src": ["'self'", "blob:"], "frame-src": ["'self'", "blob:"],
  };
}
function securityHeaders(development = false) {
  const csp = Object.entries(cspDirectives(development)).map(([key, values]) => `${key} ${values.join(" ")}`).join("; ");
  return { "Content-Security-Policy": csp, "X-Content-Type-Options": "nosniff", "X-Frame-Options": "DENY", "Referrer-Policy": "strict-origin-when-cross-origin" };
}
const helmetOptions = { contentSecurityPolicy: { useDefaults: false, directives: cspDirectives(false) }, crossOriginResourcePolicy: { policy: "same-site" } };
module.exports = { allowedOrigins, corsOptions, cspDirectives, securityHeaders, helmetOptions };
