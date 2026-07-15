// Client HTTP vers formation-service. Remplace l'ancien
// `require('../utils/serviceClients/formationClient')` du monolithe dans
// PaiementService.LINKED_PAYMENT_HANDLERS.Formation, maintenant que Paiement
// lui-même a quitté le monolithe — même contrat, juste déplacé ici avec
// finance-service.
const BASE_URL = process.env.FORMATION_SERVICE_URL
  ? `${process.env.FORMATION_SERVICE_URL}/api`
  : "http://localhost:5010/api";

async function enregistrerPaiement(id_formation, payload, authHeader) {
  const response = await fetch(`${BASE_URL}/formations/${id_formation}/paiement`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.message || `formation-service: échec enregistrement paiement (${response.status})`);
  }
  return body.data;
}

module.exports = { enregistrerPaiement };
