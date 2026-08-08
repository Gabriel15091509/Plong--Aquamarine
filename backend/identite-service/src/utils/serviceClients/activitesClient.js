// Client HTTP vers activites-service. Utilisé par AdherentService.getById
// pour afficher les statistiques réelles du carnet de plongée (carnets
// Plongee : nombre, profondeur max atteinte, temps total sous l'eau), à côté
// du champ Adherent.nb_plongees_total qui reste éditable manuellement (point
// de départ / historique, pilote le niveau sélectionnable côté formulaire).
const BASE_URL = process.env.ACTIVITES_SERVICE_URL
  ? `${process.env.ACTIVITES_SERVICE_URL}/api`
  : "http://localhost:5015/api";

async function getCarnetStats(num_adherent, authHeader) {
  // Best-effort, y compris au niveau réseau : `fetch` lui-même peut rejeter
  // (activites-service pas encore levé, ex. la fenêtre de démarrage en
  // parallèle de `npm run dev`/`concurrently`, ou down ponctuellement) —
  // pas seulement renvoyer un statut non-2xx. Sans ce try/catch, l'erreur
  // remontait non gérée jusqu'à AdherentController.getById, qui la faisait
  // échouer avec un 403 trompeur (défaut de withStatus) au lieu de
  // simplement laisser ces champs à `null` comme documenté ci-dessus.
  try {
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
  } catch (_error) {
    return null;
  }
}

module.exports = { getCarnetStats };
