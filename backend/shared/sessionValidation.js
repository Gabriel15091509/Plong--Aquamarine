const { isServiceIdentity, serviceFetch } = require("./serviceAuth");

async function validateRemoteSession(decoded, token) {
  if (isServiceIdentity(decoded)) return true;
  if (!decoded.jti) return false; // Legacy, unregistered tokens must log in again.
  const base = (process.env.IDENTITE_SERVICE_URL || "http://localhost:5014").replace(/\/api\/?$/, "").replace(/\/$/, "");
  let response;
  try { response = await serviceFetch(`${base}/api/auth/introspect`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }),
  }); } catch (error) { error.status = 503; throw error; }
  if (!response.ok) throw Object.assign(new Error("Vérification de session indisponible"), { status: 503 });
  return (await response.json()).active === true;
}
module.exports = { validateRemoteSession };
