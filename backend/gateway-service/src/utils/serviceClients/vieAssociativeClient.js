// Client HTTP vers vie-associative-service. Remplace les anciens `new
// AdhesionService()`/`new CertificatMedicalService()` en-process dans
// InscriptionService, qui ne peuvent plus fonctionner puisque les tables
// `adhesions`/`certificats_medicaux`/`alertes` ont quitté le monolithe (voir
// backend/vie-associative-service/scripts/migrate-schema.sql).
const BASE_URL = process.env.VIE_ASSOCIATIVE_SERVICE_URL
  ? `${process.env.VIE_ASSOCIATIVE_SERVICE_URL}/api`
  : "http://localhost:5013/api";

// Équivalent HTTP de l'ancien `adhesionService.checkDossierValidity(...)`.
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

// Équivalent HTTP de l'ancien `certificatMedicalService.checkCertificateStatus(...)`.
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

// Utilisé par AdherentService.getAdherentWithDetails à la place d'un
// `include: [{ model: Adhesion }]` Sequelize, qui n'appartient plus au
// monolithe.
async function getAdhesionsByAdherent(num_adherent, authHeader) {
  const response = await fetch(`${BASE_URL}/adhesions/adherent/${num_adherent}`, {
    headers: authHeader ? { Authorization: authHeader } : {},
  });
  if (!response.ok) return [];
  const body = await response.json();
  return body.data || [];
}

// Utilisé par AdherentService.getAdherentWithDetails à la place d'un
// `include: [{ model: CertificatMedical }]` Sequelize, qui n'appartient plus
// au monolithe.
async function getCertificatsByAdherent(num_adherent, authHeader) {
  const response = await fetch(`${BASE_URL}/certificats-medicaux/adherent/${num_adherent}`, {
    headers: authHeader ? { Authorization: authHeader } : {},
  });
  if (!response.ok) return [];
  const body = await response.json();
  return body.data || [];
}

// Utilisé par AdherentService.getAdherentsWithExpiringCertificates à la
// place d'un `include: [{ model: CertificatMedical }]` Sequelize, qui
// n'appartient plus au monolithe.
async function getNumAdherentsWithExpiringCertificates(days = 30) {
  const response = await fetch(`${BASE_URL}/certificats-medicaux/expiring-soon?days=${days}`);
  if (!response.ok) {
    throw new Error(`vie-associative-service: échec récupération certificats expirants (${response.status})`);
  }
  const body = await response.json();
  return (body.data || []).map((c) => c.num_adherent);
}

// Utilisé par DashboardService.getIndicateurs (CDC 3.6.2 — taux de
// renouvellement des adhésions).
async function getTauxRenouvellement() {
  const response = await fetch(`${BASE_URL}/adhesions/taux-renouvellement`);
  if (!response.ok) {
    throw new Error(`vie-associative-service: échec récupération taux de renouvellement (${response.status})`);
  }
  const body = await response.json();
  return body.data.tauxRenouvellement;
}

module.exports = {
  checkDossierValidity,
  checkCertificateStatus,
  getAdhesionsByAdherent,
  getCertificatsByAdherent,
  getNumAdherentsWithExpiringCertificates,
  getTauxRenouvellement,
};
