// Client HTTP vers finance-service (Paiement).
const BASE_URL = process.env.PAIEMENT_SERVICE_URL || "http://localhost:5012/api";

// Équivalent HTTP de l'ancien `paiementService.createLinkedPayment(...)`
// appelé en-process : crée (ou retrouve, si doublon récent) la ligne
// Paiement liée à cette formation. Renvoie `{ paiement, isDuplicate }`.
async function createLinkedPayment(payload, authHeader) {
  const response = await fetch(`${BASE_URL}/paiements/linked`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.message || `paiement-service: échec création paiement lié (${response.status})`);
  }
  return { paiement: body.data, isDuplicate: !!body.isDuplicate };
}

module.exports = { createLinkedPayment };
