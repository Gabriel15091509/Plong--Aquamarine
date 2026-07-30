// Client HTTP vers identite-service (User/Adherent/Moniteur/President/
// Tresorier). Remplace tous les anciens `include`/requêtes Sequelize
// directes sur ces modèles, qui n'appartiennent plus au même service (voir
// SortieRepository/PlongeeRepository/PalanqueeRepository/
// InscriptionRepository/AttributionRepository — motif déjà appliqué pour
// Materiel/Paiement dans le monolithe lors des découpages précédents).
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

async function getMoniteurByUserId(user_id) {
  const response = await fetch(`${BASE_URL}/moniteurs/user/${user_id}`);
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`identite-service: échec résolution moniteur pour user ${user_id} (${response.status})`);
  }
  const body = await response.json();
  return body.data;
}

// Utilisé pour vérifier, avant d'affecter un moniteur à l'encadrement d'une
// palanquée, qu'il existe réellement et récupérer ses spécialités/niveau/
// disponibilités déclarées (voir PalanqueeService.assertMoniteurAffectable).
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

async function getPresidentIdForMoniteur(id_moniteur) {
  if (!id_moniteur) return null;
  const response = await fetch(`${BASE_URL}/president/moniteur/${id_moniteur}`);
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`identite-service: échec résolution président pour moniteur ${id_moniteur} (${response.status})`);
  }
  const body = await response.json();
  return body.data ? body.data.id_president : null;
}

// Utilisé pour afficher qui a pointé une présence (Sortie.inscriptions[].checker).
async function getUserBasicById(user_id) {
  const response = await fetch(`${BASE_URL}/users/${user_id}/basic`);
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`identite-service: échec récupération utilisateur ${user_id} (${response.status})`);
  }
  const body = await response.json();
  return body.data;
}

// Utilisé par PlongeeService.validatePlongee (compte de plongées de
// l'adhérent, mis à jour à chaque plongée validée par un moniteur).
async function incrementPlongeesCount(num_adherent, authHeader) {
  const response = await fetch(`${BASE_URL}/adherents/${num_adherent}/increment-plongees`, {
    method: "PATCH",
    headers: authHeader ? { Authorization: authHeader } : {},
  });
  if (!response.ok) {
    throw new Error(`identite-service: échec incrémentation plongées (${response.status})`);
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
  getPresidentIdForMoniteur,
  getUserBasicById,
  incrementPlongeesCount,
};
