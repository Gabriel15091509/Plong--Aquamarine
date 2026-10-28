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

// Niveau minimum compatible avec chaque type de sortie — évite par exemple
// qu'une "Plongée technique" (plus exigeante) reste accessible à un Baptême,
// ou qu'une sortie "Baptême" (réservée aux non-plongeurs découvrant
// l'activité) exige un niveau déjà acquis. Même grille côté frontend, voir
// frontend/src/utils/constants.js NIVEAU_MIN_PAR_TYPE_SORTIE — à faire
// évoluer en même temps si jamais modifiée. "Baptême" est un cas à part
// (voir isTypeNiveauCompatible ci-dessous) : seul niveau compatible avec ce
// type, pas un simple minimum — une sortie Baptême visant "Niveau 3" n'aurait
// pas de sens non plus.
const NIVEAU_MIN_PAR_TYPE_SORTIE = {
  "Baptême": "Baptême",
  Formation: "Baptême",
  "Sortie bateau": "Baptême",
  Nettoyage: "Baptême",
  "Plongée d'exploration": "Niveau 1",
  "Plongée de nuit": "Niveau 1",
  "Plongée technique": "Niveau 2",
};

function isTypeNiveauCompatible(type, niveauRequis) {
  if (!type || !niveauRequis) return true;
  if (type === "Baptême") return niveauRequis === "Baptême";
  const min = NIVEAU_MIN_PAR_TYPE_SORTIE[type];
  if (!min) return true;
  const minIdx = NIVEAU_ORDER.indexOf(min);
  const niveauIdx = NIVEAU_ORDER.indexOf(niveauRequis);
  if (minIdx === -1 || niveauIdx === -1) return true;
  return niveauIdx >= minIdx;
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
  isTypeNiveauCompatible,
  computeStatutPaiement,
  profondeurMaxPourNiveau,
  STAFF_ROLES,
  NIVEAU_ORDER,
  PROFONDEUR_MAX_PAR_NIVEAU,
  NIVEAU_MIN_PAR_TYPE_SORTIE,
  ROLES,
};
