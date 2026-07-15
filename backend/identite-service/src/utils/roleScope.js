const { Adherent, Tresorier } = require("../models");

const STAFF_ROLES = ["president", "moniteur", "tresorier"];
const NIVEAU_ORDER = [
  "Débutant",
  "Niveau 1",
  "Niveau 2",
  "Niveau 3",
  "Niveau 4",
  "Moniteur",
];

function isStaff(role) {
  return STAFF_ROLES.includes(role);
}

const ROLES = {
  PRESIDENT_ONLY: ["president"],
  PRESIDENT_MONITEUR: ["president", "moniteur"],
  PRESIDENT_TRESORIER: ["president", "tresorier"],
  STAFF: STAFF_ROLES,
};

// Adherent/Tresorier vivent dans ce même service (identite-service) : ces
// deux fonctions restent des requêtes Sequelize locales, contrairement aux
// autres services qui les appellent désormais via
// serviceClients/identiteClient.js (voir formation-service par exemple).
async function getAdherentForUser(user) {
  if (!user || user.role !== "adherent") return null;
  return await Adherent.findOne({ where: { user_id: user.id } });
}

async function getTresorierIdForUser(user) {
  if (!user) return null;
  const tresorier = await Tresorier.findOne({ where: { user_id: user.id } });
  return tresorier ? tresorier.id_tresorier : null;
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
  getAdherentForUser,
  getTresorierIdForUser,
  isNiveauCompatible,
  computeStatutPaiement,
  STAFF_ROLES,
  NIVEAU_ORDER,
  ROLES,
};
