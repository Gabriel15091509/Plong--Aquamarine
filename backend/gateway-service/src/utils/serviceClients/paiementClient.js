// Client HTTP vers finance-service. Remplace les anciens `new
// PaiementService()` en-process dans AdhesionService/InscriptionService/
// AttributionService/AdherentService, qui ne peuvent plus fonctionner
// puisque la table `paiements` a quitté le schéma du monolithe (voir
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

// Équivalent HTTP de l'ancien `paiementService.marquerRembourseParReference(...)`
// (utilisé par AttributionService.restituerCaution).
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

// Utilisé par AdherentService.getAdherentWithDetails à la place d'un
// `include: [{ model: Paiement }]` Sequelize, qui n'appartient plus au
// monolithe.
async function getByAdherent(num_adherent, authHeader) {
  const response = await fetch(`${BASE_URL}/paiements/adherent/${num_adherent}`, {
    headers: authHeader ? { Authorization: authHeader } : {},
  });
  if (!response.ok) return [];
  const body = await response.json();
  return body.data || [];
}

// Utilisé par DashboardService.getTrends à la place d'une requête Sequelize
// directe (`sumTrend`) sur le modèle Paiement, qui n'appartient plus au
// monolithe.
async function getTrend() {
  const response = await fetch(`${BASE_URL}/paiements/trend`);
  if (!response.ok) {
    throw new Error(`finance-service: échec récupération tendance (${response.status})`);
  }
  const body = await response.json();
  return body.data;
}

module.exports = { createLinkedPayment, marquerRembourse, getByAdherent, getTrend };
