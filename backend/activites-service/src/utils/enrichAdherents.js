const identiteClient = require("./serviceClients/identiteClient");
const { getSystemAuthHeader } = require("./internalAuth");

// Adherent (identite-service) ne peut plus être recomposé via un `include`
// Sequelize : ce helper attache `.adherent` (ou une autre clé) à une ligne
// ou un tableau de lignes, en dédupliquant les appels HTTP par num_adherent
// distinct (évite le N+1 sur les listes).
//
// Toujours résolu avec le jeton système, jamais l'authHeader de l'appelant :
// les lignes enrichies appartiennent souvent à plusieurs adhérents distincts
// (ex. toutes les inscriptions d'une sortie), et identite-service refuse
// qu'un simple adhérent consulte la fiche d'un autre adhérent que la sienne
// (403). Cette recomposition est une simple jointure inter-services, pas une
// consultation de fiche par l'utilisateur final — la portée des droits de
// l'appelant ne s'applique pas ici.
async function withAdherent(rows, { key = "adherent", getNumAdherent = (r) => r.num_adherent } = {}) {
  const isArray = Array.isArray(rows);
  const list = isArray ? rows : [rows].filter(Boolean);
  const cache = new Map();
  const systemAuthHeader = getSystemAuthHeader();

  const plains = await Promise.all(
    list.map(async (row) => {
      const plain = row?.toJSON ? row.toJSON() : row;
      if (!plain) return plain;
      const numAdherent = getNumAdherent(plain);
      if (numAdherent) {
        if (!cache.has(numAdherent)) {
          cache.set(numAdherent, identiteClient.getAdherentById(numAdherent, systemAuthHeader));
        }
        plain[key] = await cache.get(numAdherent);
      }
      return plain;
    }),
  );

  return isArray ? plains : plains[0];
}

// Résout `.moniteur_encadrant` ({id_moniteur, name}) depuis
// `id_moniteur_encadrant` sur une ligne (palanquée) ou un tableau de lignes —
// même principe à deux sauts que withAdherent (moniteur -> user -> nom, ce
// dernier seul détenu par identite-service), dédupliqué par id_moniteur
// distinct. Best-effort par ligne : une résolution en échec (identite-
// service indisponible, moniteur supprimé...) laisse `.moniteur_encadrant`
// à `null` plutôt que de faire échouer l'ensemble de l'appel.
async function withMoniteurEncadrant(rows) {
  const isArray = Array.isArray(rows);
  const list = isArray ? rows : [rows].filter(Boolean);
  const cache = new Map();
  const systemAuthHeader = getSystemAuthHeader();
  const identiteClientRef = identiteClient;

  async function resoudre(idMoniteur) {
    try {
      const moniteur = await identiteClientRef.getMoniteurById(idMoniteur, systemAuthHeader);
      const user = moniteur?.user_id
        ? await identiteClientRef.getUserBasicById(moniteur.user_id)
        : null;
      return user ? { id_moniteur: idMoniteur, name: user.name } : null;
    } catch (error) {
      console.error(`Erreur résolution moniteur encadrant ${idMoniteur}:`, error.message);
      return null;
    }
  }

  const plains = await Promise.all(
    list.map(async (row) => {
      const plain = row?.toJSON ? row.toJSON() : row;
      if (!plain) return plain;
      const idMoniteur = plain.id_moniteur_encadrant;
      if (idMoniteur) {
        if (!cache.has(idMoniteur)) cache.set(idMoniteur, resoudre(idMoniteur));
        plain.moniteur_encadrant = await cache.get(idMoniteur);
      }
      return plain;
    }),
  );

  return isArray ? plains : plains[0];
}

module.exports = { withAdherent, withMoniteurEncadrant };
