const { getSystemAuthHeader: makeServiceAuth } = require("../../../shared/serviceAuth");

// Jeton signé pour les appels serveur-à-serveur émis par les jobs cron de ce
// service (aucun utilisateur connecté n'est à l'origine de l'action). Le
// JWT_SECRET est partagé par tous les services : c'est ce secret, pas un rôle
// particulier, qui authentifie l'appel — role "president" pour passer les
// contrôles canManage*/authorize des routes internes appelées (ex: POST
// /alertes de vie-associative-service).
function getSystemAuthHeader() {
  return makeServiceAuth();
}

module.exports = { getSystemAuthHeader };
