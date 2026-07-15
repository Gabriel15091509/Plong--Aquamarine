// Client HTTP vers activites-service (Inscription y vit désormais).
// Remplace l'ancien `require('./InscriptionService')` en-process dans
// PaiementService.LINKED_PAYMENT_HANDLERS.Sortie.
const BASE_URL = process.env.INSCRIPTION_SERVICE_URL
  ? `${process.env.INSCRIPTION_SERVICE_URL}/api`
  : "http://localhost:5015/api";

async function enregistrerPaiement(id_inscription, payload, authHeader) {
  const response = await fetch(`${BASE_URL}/inscriptions/${id_inscription}/paiement`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.message || `inscription: échec enregistrement paiement (${response.status})`);
  }
  return body.data;
}

module.exports = { enregistrerPaiement };
