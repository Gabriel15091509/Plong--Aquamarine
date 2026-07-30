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

// Résout l'Adherent correspondant à l'utilisateur connecté (retourne null
// pour un rôle non-adhérent) — utilisé pour vérifier qu'un adhérent ne
// consulte que sa propre formation, jamais celle d'un autre (même schéma que
// activites-service pour le carnet de plongée).
async function getAdherentForUser(user) {
  if (!user || user.role !== "adherent") return null;
  const response = await fetch(`${BASE_URL}/adherents/user/${user.id}`);
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`identite-service: échec résolution adhérent pour user ${user.id} (${response.status})`);
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

// Résout le Moniteur correspondant à l'utilisateur connecté (retourne null
// si l'utilisateur n'est pas moniteur) — utilisé pour vérifier qu'un moniteur
// ne modifie que les formations/séances/compétences qui lui sont assignées
// (même schéma que activites-service pour l'affectation aux palanquées).
async function getMoniteurByUserId(user_id) {
  const response = await fetch(`${BASE_URL}/moniteurs/user/${user_id}`);
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`identite-service: échec résolution moniteur pour user ${user_id} (${response.status})`);
  }
  const body = await response.json();
  return body.data;
}

// Utilisé pour vérifier, avant d'affecter un moniteur à une formation, qu'il
// existe réellement et récupérer son niveau/ses spécialités déclarées (voir
// FormationService.assertMoniteurQualifie).
async function getMoniteurById(id_moniteur, authHeader) {
  if (!id_moniteur) return null;
  const response = await fetch(`${BASE_URL}/moniteurs/${id_moniteur}`, {
    headers: authHeader ? { Authorization: authHeader } : {},
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`identite-service: échec récupération moniteur ${id_moniteur} (${response.status})`);
  }
  const body = await response.json();
  return body.data;
}

// Appelé quand une formation est marquée terminée (toutes les compétences de
// la check-list validées) pour répercuter le niveau obtenu sur l'adhérent.
// `extra` (num_brevet/num_licence_ffesm) est optionnel — JSON.stringify omet
// les clés `undefined`, donc identite-service ne touche pas à ces champs
// s'ils ne sont pas fournis (cas du passage automatique, sans saisie humaine).
async function updateNiveau(numAdherent, niveau, extra = {}, authHeader) {
  const response = await fetch(`${BASE_URL}/adherents/${numAdherent}/niveau`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
    body: JSON.stringify({ niveau, ...extra }),
  });
  if (!response.ok) {
    throw new Error(`identite-service: échec mise à jour niveau adhérent ${numAdherent} (${response.status})`);
  }
  const body = await response.json();
  return body.data;
}

module.exports = {
  getAdherentById,
  getAdherentForUser,
  getTresorierIdForUser,
  getMoniteurByUserId,
  getMoniteurById,
  updateNiveau,
};
