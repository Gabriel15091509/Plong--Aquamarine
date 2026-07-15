// Client HTTP vers materiel-service. Remplace les anciens `new
// MaterielService()`/`new ReparationService()` en-process (motif déjà
// appliqué dans le monolithe lors du découpage de materiel-service).
const BASE_URL = process.env.MATERIEL_SERVICE_URL
  ? `${process.env.MATERIEL_SERVICE_URL}/api`
  : "http://localhost:5011/api";

async function checkAvailability(num_inventaire) {
  const response = await fetch(`${BASE_URL}/materiels/${num_inventaire}/availability`);
  if (!response.ok) {
    throw new Error(`materiel-service: échec vérification disponibilité (${response.status})`);
  }
  const body = await response.json();
  return body.data.available;
}

async function getByNumInventaire(num_inventaire) {
  const response = await fetch(`${BASE_URL}/materiels/${num_inventaire}`);
  if (!response.ok) return null;
  const body = await response.json();
  return body.data;
}

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

module.exports = { checkAvailability, getByNumInventaire, createReparation };
