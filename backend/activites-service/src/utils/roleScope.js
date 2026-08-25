// Version activites-service de roleScope.js : ne garde que les éléments
// stateless (pas de dépendance à un modèle Sequelize d'un autre domaine).
// `getAdherentForUser`/`getTresorierIdForUser` (qui interrogent Adherent/
// Tresorier, propriété d'identite-service) vivent désormais dans
// `serviceClients/identiteClient.js` sous forme d'appel HTTP.

const STAFF_ROLES = ["president", "moniteur", "tresorier"];
const NIVEAU_ORDER = [
  "Baptême",
  "Niveau 1",
  "Niveau 2",
  "Niveau 3",
  "Niveau 4",
  "Moniteur",
];

// Profondeur max encadrée standard par niveau (norme FFESM — les sorties
// club sont toujours encadrées par un moniteur/DP) : utilisée par
// SortieService.create pour pré-remplir profondeur_max quand l'appelant ne
// l'a pas fourni explicitement, au lieu de laisser ce champ totalement
// déconnecté du niveau requis choisi. Même grille côté frontend, voir
// frontend/src/utils/constants.js PROFONDEUR_MAX_PAR_NIVEAU — à faire
// évoluer en même temps si jamais modifiée.
const PROFONDEUR_MAX_PAR_NIVEAU = {
  "Baptême": 6,
  "Niveau 1": 20,
  "Niveau 2": 40,
  "Niveau 3": 60,
  "Niveau 4": 60,
  Moniteur: 60,
};

function profondeurMaxPourNiveau(niveau) {
  return PROFONDEUR_MAX_PAR_NIVEAU[niveau] ?? null;
}

const ROLES = {
  PRESIDENT_ONLY: ["president"],
  PRESIDENT_MONITEUR: ["president", "moniteur"],
  PRESIDENT_TRESORIER: ["president", "tresorier"],
  STAFF: STAFF_ROLES,
};

function isStaff(role) {
  return STAFF_ROLES.includes(role);
}

function computeStatutPaiement(montantTotal, montantPaye) {
  const total = Number(montantTotal) || 0;
  const paye = Number(montantPaye) || 0;
  if (paye <= 0) return "En attente";
  if (paye < total) return "Partiel";
  return "Payé";
}

function isNiveauCompatible(adherentNiveau, niveauRequis) {
  if (!niveauRequis) return true;
  const requis = NIVEAU_ORDER.indexOf(niveauRequis);
  if (requis === -1) return true;
  const possede = NIVEAU_ORDER.indexOf(adherentNiveau);
  return possede >= requis;
}

module.exports = {
  isStaff,
  isNiveauCompatible,
  computeStatutPaiement,
  profondeurMaxPourNiveau,
  STAFF_ROLES,
  NIVEAU_ORDER,
  PROFONDEUR_MAX_PAR_NIVEAU,
  ROLES,
};
