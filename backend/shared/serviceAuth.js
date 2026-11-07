const crypto = require("node:crypto");

const AUDIENCE = "aquanature-services";
function getSystemAuthHeader() {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ id: 0, email: "system@internal", role: "president", name: "Système", service: true, aud: AUDIENCE, iat: now, exp: now + 60 })).toString("base64url");
  const value = `${header}.${payload}`;
  const signature = crypto.createHmac("sha256", process.env.JWT_SECRET).update(value).digest("base64url");
  return `Bearer ${value}.${signature}`;
}
function isServiceIdentity(decoded) {
  return decoded?.id === 0 && decoded.service === true && decoded.aud === AUDIENCE;
}
function isInternalRequest(req) {
  const value = req.headers["x-service-authorization"];
  if (typeof value !== "string" || !value.startsWith("Bearer ")) return false;
  try {
    const [header, payload, signature, extra] = value.slice(7).split(".");
    if (extra || JSON.parse(Buffer.from(header, "base64url")).alg !== "HS256") return false;
    const expected = crypto.createHmac("sha256", process.env.JWT_SECRET).update(`${header}.${payload}`).digest();
    const supplied = Buffer.from(signature, "base64url");
    if (supplied.length !== expected.length || !crypto.timingSafeEqual(expected, supplied)) return false;
    const decoded = JSON.parse(Buffer.from(payload, "base64url"));
    const now = Math.floor(Date.now() / 1000);
    return isServiceIdentity(decoded) && decoded.exp > now && decoded.exp <= now + 65 && decoded.iat <= now + 5;
  } catch { return false; }
}
function requireInternal(req, res, next) {
  if (!isInternalRequest(req)) return res.status(403).json({ success: false, message: "Appel réservé aux services internes" });
  next();
}
async function serviceFetch(url, options = {}) {
  const headers = new Headers(options.headers);
  const serviceAuth = getSystemAuthHeader();
  if (!headers.has("Authorization")) headers.set("Authorization", serviceAuth);
  headers.set("X-Service-Authorization", serviceAuth);
  return globalThis.fetch(url, { ...options, headers, signal: options.signal || AbortSignal.timeout(10000) });
}
module.exports = { getSystemAuthHeader, isServiceIdentity, isInternalRequest, requireInternal, serviceFetch };
