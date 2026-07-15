// Client HTTP vers vie-associative-service. Utilisé par
// AdherentService.getAdherentWithDetails (recompose `.adhesions`/
// `.certificats`) et getAdherentsWithExpiringCertificates, à la place
// d'`include`/de requêtes Sequelize directes sur des modèles qui
// n'appartiennent plus au même service.
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

module.exports = {
  getAdhesionsByAdherent,
  getCertificatsByAdherent,
  getNumAdherentsWithExpiringCertificates,
};
