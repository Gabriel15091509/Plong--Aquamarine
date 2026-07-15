// Client HTTP vers identite-service — remplace l'ancienne requête Sequelize
// directe sur le modèle Adherent dans DashboardService, qui n'appartient
// plus au monolithe (voir backend/identite-service/scripts/migrate-schema.sql).
const BASE_URL = process.env.IDENTITE_SERVICE_URL
  ? `${process.env.IDENTITE_SERVICE_URL}/api`
  : "http://localhost:5014/api";

// Utilisé par DashboardService.getTrends à la place d'une requête Sequelize
// directe sur le modèle Adherent, qui n'appartient plus au monolithe.
async function getTrend() {
  const response = await fetch(`${BASE_URL}/adherents/trend`);
  if (!response.ok) {
    throw new Error(`identite-service: échec récupération tendance (${response.status})`);
  }
  const body = await response.json();
  return body.data;
}

module.exports = { getTrend };
