// Client HTTP vers vie-associative-service. Utilisé par InscriptionService
// pour valider le dossier d'adhésion et le statut du certificat médical d'un
// adhérent avant de confirmer son inscription à une sortie (anciennement des
// appels en-process à AdhesionService/CertificatMedicalService).
const { getSystemAuthHeader } = require("../internalAuth");

const BASE_URL = process.env.VIE_ASSOCIATIVE_SERVICE_URL
  ? `${process.env.VIE_ASSOCIATIVE_SERVICE_URL}/api`
  : "http://localhost:5013/api";

async function checkDossierValidity(num_adherent, authHeader, requiredTypes) {
  const query = requiredTypes ? `?types=${requiredTypes.map(encodeURIComponent).join(",")}` : "";
  const response = await fetch(`${BASE_URL}/adhesions/adherent/${num_adherent}/dossier-status${query}`, {
    headers: authHeader ? { Authorization: authHeader } : {},
  });
  if (!response.ok) {
    throw new Error(`vie-associative-service: échec vérification dossier (${response.status})`);
  }
  const body = await response.json();
  return body.data;
}

async function checkCertificateStatus(num_adherent, authHeader) {
  const response = await fetch(`${BASE_URL}/certificats-medicaux/adherent/${num_adherent}/status`, {
    headers: authHeader ? { Authorization: authHeader } : {},
  });
  if (!response.ok) {
    throw new Error(`vie-associative-service: échec vérification certificat (${response.status})`);
  }
  const body = await response.json();
  return body.data;
}

// Utilisé par les crons d'alerte (attribution en retard, inactivité carnet de
// plongée) qui n'ont pas de requête utilisateur/authHeader à disposition —
// authentifié via un jeton interne signé avec le JWT_SECRET partagé.
async function createAlerte(num_adherent, type) {
  const response = await fetch(`${BASE_URL}/alertes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: getSystemAuthHeader(),
    },
    body: JSON.stringify({ num_adherent, type, canal: "Notification" }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || `vie-associative-service: échec création alerte (${response.status})`);
  }
}

module.exports = {
  checkDossierValidity,
  checkCertificateStatus,
  createAlerte,
};
