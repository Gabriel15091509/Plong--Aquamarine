// Client HTTP vers formation-service — premier domaine découpé en
// microservice. Remplace les anciens `new FormationService()` en-process
// dans PaiementService/DashboardService, qui ne peuvent plus fonctionner
// puisque les tables `formations`/`competences` ont quitté le schéma du
// monolithe (voir backend-services/formation-service/scripts/migrate-schema.sql).
const BASE_URL = process.env.FORMATION_SERVICE_URL
  ? `${process.env.FORMATION_SERVICE_URL}/api`
  : "http://localhost:5010/api";

// Équivalent HTTP de l'ancien `formationService.enregistrerPaiement(...)`
// appelé en-process depuis `PaiementService.LINKED_PAYMENT_HANDLERS.Formation`.
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

// Utilisé par DashboardService.getTrends à la place d'une requête Sequelize
// directe sur le modèle Formation, qui n'appartient plus au monolithe.
async function getTrend() {
  const response = await fetch(`${BASE_URL}/formations/trend`);
  if (!response.ok) {
    throw new Error(`formation-service: échec récupération tendance (${response.status})`);
  }
  const body = await response.json();
  return body.data;
}

module.exports = { enregistrerPaiement, getTrend };
