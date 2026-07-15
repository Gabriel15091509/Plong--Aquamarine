// Client HTTP vers finance-service. Remplace l'ancien `new PaiementService()`
// en-process dans AdhesionService, qui ne peut plus fonctionner puisque la
// table `paiements` a quitté le monolithe (voir
// backend/finance-service/scripts/migrate-schema.sql).
const BASE_URL = process.env.FINANCE_SERVICE_URL
  ? `${process.env.FINANCE_SERVICE_URL}/api`
  : "http://localhost:5012/api";

// Équivalent HTTP de l'ancien `paiementService.createLinkedPayment(...)`,
// mais via la route interne `/paiements/linked` qui fait aussi la
// dé-duplication côté finance-service (voir
// PaiementService.createLinkedPaymentFromRemote) — l'appelant met à jour son
// propre solde local seulement si `isDuplicate` est faux.
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
    throw new Error(body.message || `finance-service: échec création paiement lié (${response.status})`);
  }
  return { paiement: body.data, isDuplicate: !!body.isDuplicate };
}

module.exports = { createLinkedPayment };
