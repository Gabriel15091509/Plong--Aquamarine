// Client HTTP vers vie-associative-service. Utilisé par FormationService pour
// vérifier le dossier d'adhésion (3 combos obligatoires : Club, FFESM,
// Assurance RC) avant de valider l'inscription d'un adhérent à une formation
// (même vérification que celle faite par activites-service avant une
// inscription à une sortie, voir InscriptionService.js).
const BASE_URL = process.env.VIE_ASSOCIATIVE_SERVICE_URL
  ? `${process.env.VIE_ASSOCIATIVE_SERVICE_URL}/api`
  : "http://localhost:5013/api";

async function checkDossierValidity(num_adherent, authHeader) {
  const response = await fetch(`${BASE_URL}/adhesions/adherent/${num_adherent}/dossier-status`, {
    headers: authHeader ? { Authorization: authHeader } : {},
  });
  if (!response.ok) {
    throw new Error(`vie-associative-service: échec vérification dossier (${response.status})`);
  }
  const body = await response.json();
  return body.data;
}

module.exports = { checkDossierValidity };
