// Client HTTP vers activites-service. Utilisé par SeanceService pour
// vérifier qu'une séance "Pratique" est bien liée à une sortie existante,
// de type "Formation" (cf. taxonomie des types d'activités).
const BASE_URL = process.env.ACTIVITES_SERVICE_URL
  ? `${process.env.ACTIVITES_SERVICE_URL}/api`
  : "http://localhost:5015/api";

async function getSortieById(id, authHeader) {
  const response = await fetch(`${BASE_URL}/sorties/${id}`, {
    headers: authHeader ? { Authorization: authHeader } : {},
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`activites-service: échec récupération sortie ${id} (${response.status})`);
  }
  const body = await response.json();
  return body.data;
}

// Utilisé par FormationService.checkPrerequis pour vérifier la profondeur
// minimale déjà atteinte par l'adhérent avant d'accepter une formation visant
// le niveau supérieur (voir PREREQUIS_FORMATION.profondeurMin).
async function getProfondeurMaxAdherent(num_adherent, authHeader) {
  const response = await fetch(`${BASE_URL}/plongees/adherent/${num_adherent}`, {
    headers: authHeader ? { Authorization: authHeader } : {},
  });
  if (!response.ok) {
    throw new Error(
      `activites-service: échec récupération carnet de plongée ${num_adherent} (${response.status})`,
    );
  }
  const body = await response.json();
  return body.profondeurMax || 0;
}

module.exports = { getSortieById, getProfondeurMaxAdherent };
