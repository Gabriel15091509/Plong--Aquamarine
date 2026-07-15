// Client HTTP vers finance-service. Utilisé par
// AdherentService.getAdherentWithDetails pour recomposer `.paiements`, à la
// place d'un `include: [{ model: Paiement }]` Sequelize qui n'appartient
// plus au même service.
const BASE_URL = process.env.FINANCE_SERVICE_URL
  ? `${process.env.FINANCE_SERVICE_URL}/api`
  : "http://localhost:5012/api";

async function getByAdherent(num_adherent, authHeader) {
  const response = await fetch(`${BASE_URL}/paiements/adherent/${num_adherent}`, {
    headers: authHeader ? { Authorization: authHeader } : {},
  });
  if (!response.ok) return [];
  const body = await response.json();
  return body.data || [];
}

module.exports = { getByAdherent };
