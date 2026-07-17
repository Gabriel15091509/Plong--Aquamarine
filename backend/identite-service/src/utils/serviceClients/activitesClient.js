// Client HTTP vers activites-service. Utilisé par AdherentService.getById
// pour afficher les statistiques réelles du carnet de plongée (carnets
// Plongee : nombre, profondeur max atteinte, temps total sous l'eau), à côté
// du champ Adherent.nb_plongees_total qui reste éditable manuellement (point
// de départ / historique, pilote le niveau sélectionnable côté formulaire).
const BASE_URL = process.env.ACTIVITES_SERVICE_URL
  ? `${process.env.ACTIVITES_SERVICE_URL}/api`
  : "http://localhost:5015/api";

async function getCarnetStats(num_adherent, authHeader) {
  const response = await fetch(`${BASE_URL}/plongees/adherent/${num_adherent}`, {
    headers: authHeader ? { Authorization: authHeader } : {},
  });
  if (!response.ok) return null;
  const body = await response.json();
  if (typeof body.count !== "number") return null;
  return {
    count: body.count,
    profondeurMax: body.profondeurMax ?? null,
    dureeTotale: body.dureeTotale ?? null,
  };
}

module.exports = { getCarnetStats };
