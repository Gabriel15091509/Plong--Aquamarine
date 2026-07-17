// Client HTTP vers vie-associative-service, seul propriétaire de la table
// `alertes`. Utilisé par le cron de relance des impayés (PaiementService),
// qui n'a pas de requête utilisateur/authHeader à sa disposition.
const { getSystemAuthHeader } = require("../internalAuth");

const BASE_URL = process.env.VIE_ASSOCIATIVE_SERVICE_URL
  ? `${process.env.VIE_ASSOCIATIVE_SERVICE_URL}/api`
  : "http://localhost:5013/api";

async function createAlerte(num_adherent, type) {
  const response = await fetch(`${BASE_URL}/alertes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: getSystemAuthHeader(),
    },
    body: JSON.stringify({ num_adherent, type, canal: "Notification" }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || `vie-associative-service: échec création alerte (${response.status})`);
  }
}

module.exports = { createAlerte };
