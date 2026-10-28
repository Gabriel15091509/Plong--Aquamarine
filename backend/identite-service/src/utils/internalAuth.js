const jwt = require("jsonwebtoken");

// Jeton signé pour les appels serveur-à-serveur émis par ce service sans
// utilisateur connecté à l'origine (ex: AdherentService.updateNiveau créant
// automatiquement une licence FFESM sur vie-associative-service). Le
// JWT_SECRET est partagé par tous les services : c'est ce secret, pas un
// rôle particulier, qui authentifie l'appel — role "president" pour passer
// les contrôles canManage*/authorize des routes internes appelées (ex: POST
// /adhesions/adherent/:num_adherent/licence-automatique de
// vie-associative-service). Même utilitaire que activites-service/finance-
// service (src/utils/internalAuth.js) — dupliqué plutôt que partagé, ces
// services n'ayant pas de package commun.
function getSystemAuthHeader() {
  const token = jwt.sign(
    { id: 0, email: "system@internal", role: "president", name: "Système" },
    process.env.JWT_SECRET,
    { expiresIn: "5m" },
  );
  return `Bearer ${token}`;
}

module.exports = { getSystemAuthHeader };
