// Client HTTP vers vie-associative-service. Utilisé par
// AdherentService.getAdherentWithDetails (recompose `.adhesions`/
// `.certificats`) et getAdherentsWithExpiringCertificates, à la place
// d'`include`/de requêtes Sequelize directes sur des modèles qui
// n'appartiennent plus au même service.
const { getSystemAuthHeader } = require("../internalAuth");

const BASE_URL = process.env.VIE_ASSOCIATIVE_SERVICE_URL
  ? `${process.env.VIE_ASSOCIATIVE_SERVICE_URL}/api`
  : "http://localhost:5013/api";

async function getAdhesionsByAdherent(num_adherent, authHeader) {
  const response = await fetch(`${BASE_URL}/adhesions/adherent/${num_adherent}`, {
    headers: authHeader ? { Authorization: authHeader } : {},
  });
  if (!response.ok) return [];
  const body = await response.json();
  return body.data || [];
}

async function getCertificatsByAdherent(num_adherent, authHeader) {
  const response = await fetch(`${BASE_URL}/certificats-medicaux/adherent/${num_adherent}`, {
    headers: authHeader ? { Authorization: authHeader } : {},
  });
  if (!response.ok) return [];
  const body = await response.json();
  return body.data || [];
}

async function getNumAdherentsWithExpiringCertificates(days = 30) {
  const response = await fetch(`${BASE_URL}/certificats-medicaux/expiring-soon?days=${days}`);
  if (!response.ok) {
    throw new Error(`vie-associative-service: échec récupération certificats expirants (${response.status})`);
  }
  const body = await response.json();
  return (body.data || []).map((c) => c.num_adherent);
}

// Appelé par AdherentService.updateNiveau quand un adhérent passe de
// "Baptême" à "Niveau 1" : crée automatiquement (côté vie-associative-
// service) les lignes Adhesion FFESM + Assurance RC "En attente", à
// compléter par le président/trésorier — voir AdhesionService.
// creerLicenceAutomatique pour le détail. Authentifié via un jeton interne
// (pas de requête utilisateur/authHeader à cet endroit : le déclencheur est
// un changement de niveau, quel que soit le rôle de la personne qui a
// validé la formation à l'origine).
async function creerLicenceAutomatique(num_adherent, dateObtention) {
  const response = await fetch(`${BASE_URL}/adhesions/adherent/${num_adherent}/licence-automatique`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: getSystemAuthHeader(),
    },
    body: JSON.stringify({ date_obtention: dateObtention }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      body.message || `vie-associative-service: échec création licence automatique (${response.status})`,
    );
  }
  const body = await response.json();
  return body.data;
}

module.exports = {
  getAdhesionsByAdherent,
  getCertificatsByAdherent,
  getNumAdherentsWithExpiringCertificates,
  creerLicenceAutomatique,
};
