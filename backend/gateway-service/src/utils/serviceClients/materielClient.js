// Client HTTP vers materiel-service. Remplace les anciens `new
// MaterielService()`/`new ReparationService()` en-process dans
// AttributionService/PalanqueeService, qui ne peuvent plus fonctionner
// puisque les tables `materiels`/`reparations` ont quitté le schéma du
// monolithe (voir backend/materiel-service/scripts/migrate-schema.sql).
const BASE_URL = process.env.MATERIEL_SERVICE_URL
  ? `${process.env.MATERIEL_SERVICE_URL}/api`
  : "http://localhost:5011/api";

// Équivalent HTTP de l'ancien `materielService.checkAvailability(...)`.
// Route publique côté materiel-service (pas d'Authorization nécessaire).
async function checkAvailability(num_inventaire) {
  const response = await fetch(`${BASE_URL}/materiels/${num_inventaire}/availability`);
  if (!response.ok) {
    throw new Error(`materiel-service: échec vérification disponibilité (${response.status})`);
  }
  const body = await response.json();
  return body.data.available;
}

// Équivalent HTTP de l'ancien `materielService.getById(...)`.
async function getByNumInventaire(num_inventaire) {
  const response = await fetch(`${BASE_URL}/materiels/${num_inventaire}`);
  if (!response.ok) return null;
  const body = await response.json();
  return body.data;
}

// Équivalent HTTP de l'ancien `reparationService.create(...)` (appelé depuis
// AttributionService.traiterDeterioration et PalanqueeService.retournerMateriel).
async function createReparation(payload, authHeader) {
  const response = await fetch(`${BASE_URL}/reparations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.message || `materiel-service: échec création réparation (${response.status})`);
  }
  return body.data;
}

// Utilisé par DashboardService.getTrends à la place d'une requête Sequelize
// directe sur le modèle Materiel, qui n'appartient plus au monolithe.
async function getTrend() {
  const response = await fetch(`${BASE_URL}/materiels/trend`);
  if (!response.ok) {
    throw new Error(`materiel-service: échec récupération tendance (${response.status})`);
  }
  const body = await response.json();
  return body.data;
}

// Utilisé par DashboardService.getIndicateurs (CDC 3.6.2 — matériel à
// réviser, mis en avant sur le dashboard plutôt que relégué à une page
// dédiée).
async function getNbNeedingMaintenance() {
  const response = await fetch(`${BASE_URL}/materiels/needing-maintenance`);
  if (!response.ok) {
    throw new Error(`materiel-service: échec récupération matériel à réviser (${response.status})`);
  }
  const body = await response.json();
  return (body.data || []).length;
}

module.exports = {
  checkAvailability,
  getByNumInventaire,
  createReparation,
  getTrend,
  getNbNeedingMaintenance,
};
