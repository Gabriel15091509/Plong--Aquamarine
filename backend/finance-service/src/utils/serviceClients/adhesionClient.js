// Client HTTP vers vie-associative-service (Adhesion y vit désormais).
// Remplace l'ancien `require('./AdhesionService')` en-process dans
// PaiementService.LINKED_PAYMENT_HANDLERS.Adhesion.
const BASE_URL = process.env.ADHESION_SERVICE_URL
  ? `${process.env.ADHESION_SERVICE_URL}/api`
  : "http://localhost:5013/api";

async function enregistrerPaiement(id_adhesion, payload, authHeader) {
  const response = await fetch(`${BASE_URL}/adhesions/${id_adhesion}/paiement`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.message || `adhesion: échec enregistrement paiement (${response.status})`);
  }
  return body.data;
}

module.exports = { enregistrerPaiement };
