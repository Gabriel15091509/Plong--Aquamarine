// Client HTTP vers finance-service. Remplace les anciens `new
// PaiementService()` en-process (motif déjà appliqué dans le monolithe lors
// du découpage de finance-service).
const BASE_URL = process.env.FINANCE_SERVICE_URL
  ? `${process.env.FINANCE_SERVICE_URL}/api`
  : "http://localhost:5012/api";

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

async function marquerRembourse(type_paiement, reference_id, authHeader) {
  const response = await fetch(`${BASE_URL}/paiements/marquer-rembourse`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
    body: JSON.stringify({ type_paiement, reference_id }),
  });
  if (!response.ok) {
    throw new Error(`finance-service: échec marquage remboursement (${response.status})`);
  }
  const body = await response.json();
  return body.data;
}

module.exports = { createLinkedPayment, marquerRembourse };
