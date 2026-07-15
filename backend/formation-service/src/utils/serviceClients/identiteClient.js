// Client HTTP vers identite-service (User/Adherent/Moniteur/President/
// Tresorier).
const BASE_URL = process.env.IDENTITE_SERVICE_URL || "http://localhost:5014/api";

async function getAdherentById(numAdherent, authHeader) {
  const response = await fetch(`${BASE_URL}/adherents/${numAdherent}`, {
    headers: authHeader ? { Authorization: authHeader } : {},
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`identite-service: échec récupération adhérent ${numAdherent} (${response.status})`);
  }
  const body = await response.json();
  return body.data;
}

// Pas d'auth requise côté identite-service pour cette route (cf.
// `tresorierRoutes.js` : `GET /tresoriers/user/:user_id` est publique, comme
// c'était déjà le cas dans le monolithe avant le découpage).
async function getTresorierIdForUser(user) {
  if (!user) return null;
  const response = await fetch(`${BASE_URL}/tresoriers/user/${user.id}`);
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`identite-service: échec résolution trésorier pour user ${user.id} (${response.status})`);
  }
  const body = await response.json();
  return body.data ? body.data.id_tresorier : null;
}

module.exports = { getAdherentById, getTresorierIdForUser };
