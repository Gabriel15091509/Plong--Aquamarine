// Version vie-associative-service de roleScope.js : ne garde que les
// éléments stateless (pas de dépendance à un modèle Sequelize d'un autre
// domaine). `getAdherentForUser`/`getTresorierIdForUser` (qui interrogent
// Adherent/Tresorier, propriété d'identite-service) vivent désormais dans
// `serviceClients/identiteClient.js` sous forme d'appel HTTP.

const STAFF_ROLES = ["president", "moniteur", "tresorier"];

const ROLES = {
  PRESIDENT_ONLY: ["president"],
  PRESIDENT_MONITEUR: ["president", "moniteur"],
  PRESIDENT_TRESORIER: ["president", "tresorier"],
  STAFF: STAFF_ROLES,
};

function isStaff(role) {
  return STAFF_ROLES.includes(role);
}

// "En attente" (rien reçu) / "Partiel" (reçu partiel) / "Payé" (soldé).
function computeStatutPaiement(montantTotal, montantPaye) {
  const total = Number(montantTotal) || 0;
  const paye = Number(montantPaye) || 0;
  if (paye <= 0) return "En attente";
  if (paye < total) return "Partiel";
  return "Payé";
}

module.exports = {
  isStaff,
  computeStatutPaiement,
  STAFF_ROLES,
  ROLES,
};
