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

// Appelé quand une formation est marquée terminée (toutes les compétences de
// la check-list validées) pour répercuter le niveau obtenu sur l'adhérent.
async function updateNiveau(numAdherent, niveau, authHeader) {
  const response = await fetch(`${BASE_URL}/adherents/${numAdherent}/niveau`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
    body: JSON.stringify({ niveau }),
  });
  if (!response.ok) {
    throw new Error(`identite-service: échec mise à jour niveau adhérent ${numAdherent} (${response.status})`);
  }
  const body = await response.json();
  return body.data;
}

module.exports = { getAdherentById, getTresorierIdForUser, updateNiveau };
