const identiteClient = require("./serviceClients/identiteClient");

// Adherent (identite-service) ne peut plus être recomposé via un `include`
// Sequelize : ce helper attache `.adherent` (ou une autre clé) à une ligne
// ou un tableau de lignes, en dédupliquant les appels HTTP par num_adherent
// distinct (évite le N+1 sur les listes).
async function withAdherent(rows, { authHeader, key = "adherent", getNumAdherent = (r) => r.num_adherent } = {}) {
  const isArray = Array.isArray(rows);
  const list = isArray ? rows : [rows].filter(Boolean);
  const cache = new Map();

  const plains = await Promise.all(
    list.map(async (row) => {
      const plain = row?.toJSON ? row.toJSON() : row;
      if (!plain) return plain;
      const numAdherent = getNumAdherent(plain);
      if (numAdherent) {
        if (!cache.has(numAdherent)) {
          cache.set(numAdherent, identiteClient.getAdherentById(numAdherent, authHeader));
        }
        plain[key] = await cache.get(numAdherent);
      }
      return plain;
    }),
  );

  return isArray ? plains : plains[0];
}

module.exports = { withAdherent };
