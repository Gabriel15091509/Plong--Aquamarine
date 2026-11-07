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
// plongée, modification d'une sortie) qui n'ont pas de requête utilisateur/
// authHeader à disposition — authentifié via un jeton interne signé avec le
// JWT_SECRET partagé. `detail` (libellé complémentaire, ex. quels champs ont
// changé) et `referenceType`/`referenceId` (ligne source, ex. la sortie
// modifiée — sert de clé de dédup côté AlerteService.upsertAutomaticAlerte
// et permet au frontend de rediriger vers la bonne fiche, voir
// AlerteDetailsModal.jsx) sont optionnels, omis du corps envoyé si absents.
async function createAlerte(num_adherent, type, { detail, referenceType, referenceId } = {}) {
  const response = await fetch(`${BASE_URL}/alertes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: getSystemAuthHeader(),
    },
    body: JSON.stringify({
      num_adherent,
      type,
      canal: "Notification",
      ...(detail ? { detail } : {}),
      ...(referenceType ? { reference_type: referenceType } : {}),
      ...(referenceId != null ? { reference_id: referenceId } : {}),
    }),
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
const { serviceFetch: fetch } = require("../../../../shared/serviceAuth");
