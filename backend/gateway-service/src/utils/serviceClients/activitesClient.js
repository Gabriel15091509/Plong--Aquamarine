// Client HTTP vers activites-service — remplace les anciennes requêtes
// Sequelize directes sur les modèles Sortie/Plongee dans DashboardService,
// qui n'appartiennent plus au monolithe (voir
// backend/activites-service/scripts/migrate-schema.sql).
const BASE_URL = process.env.ACTIVITES_SERVICE_URL
  ? `${process.env.ACTIVITES_SERVICE_URL}/api`
  : "http://localhost:5015/api";

// Utilisé par DashboardService.getTrends à la place d'une requête Sequelize
// directe sur le modèle Sortie, qui n'appartient plus au monolithe.
async function getSortiesTrend() {
  const response = await fetch(`${BASE_URL}/sorties/trend`);
  if (!response.ok) {
    throw new Error(`activites-service: échec récupération tendance sorties (${response.status})`);
  }
  const body = await response.json();
  return body.data;
}

// Utilisé par DashboardService.getTrends à la place d'une requête Sequelize
// directe sur le modèle Plongee, qui n'appartient plus au monolithe.
async function getPlongeesTrend() {
  const response = await fetch(`${BASE_URL}/plongees/trend`);
  if (!response.ok) {
    throw new Error(`activites-service: échec récupération tendance plongées (${response.status})`);
  }
  const body = await response.json();
  return body.data;
}

module.exports = { getSortiesTrend, getPlongeesTrend };
