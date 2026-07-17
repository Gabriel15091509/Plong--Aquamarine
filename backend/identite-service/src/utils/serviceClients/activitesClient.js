// Client HTTP vers activites-service. Utilisé par AdherentService.getById
// pour afficher le nombre réel de plongées enregistrées au club (carnets
// Plongee), à côté du champ Adherent.nb_plongees_total qui reste éditable
// manuellement (point de départ / historique, pilote le niveau sélectionnable
// côté formulaire).
const BASE_URL = process.env.ACTIVITES_SERVICE_URL
  ? `${process.env.ACTIVITES_SERVICE_URL}/api`
  : "http://localhost:5015/api";

async function getNbPlongeesReelles(num_adherent, authHeader) {
  const response = await fetch(`${BASE_URL}/plongees/adherent/${num_adherent}`, {
    headers: authHeader ? { Authorization: authHeader } : {},
  });
  if (!response.ok) return null;
  const body = await response.json();
  return typeof body.count === "number" ? body.count : null;
}

module.exports = { getNbPlongeesReelles };
