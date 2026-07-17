// Client HTTP vers vie-associative-service. Utilisé par InscriptionService
// pour valider le dossier d'adhésion et le statut du certificat médical d'un
// adhérent avant de confirmer son inscription à une sortie (anciennement des
// appels en-process à AdhesionService/CertificatMedicalService).
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

module.exports = {
  checkDossierValidity,
  checkCertificateStatus,
};
