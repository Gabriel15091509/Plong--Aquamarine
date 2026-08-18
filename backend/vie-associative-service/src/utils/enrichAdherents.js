const identiteClient = require("./serviceClients/identiteClient");

// Alerte (vie_associative) ne référence l'adhérent que par `num_adherent`
// (identite-service, autre schéma) : ce helper attache son nom/email à une
// ligne ou un tableau de lignes, en dédupliquant les appels HTTP par
// num_adherent distinct (évite le N+1 sur les listes d'alertes).
async function withAdherentNames(rows, authHeader, { getNumAdherent = (r) => r.num_adherent } = {}) {
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
          cache.set(
            numAdherent,
            identiteClient.getAdherentById(numAdherent, authHeader).catch(() => null),
          );
        }
        const adherent = await cache.get(numAdherent);
        plain.adherent_nom = adherent ? `${adherent.prenom} ${adherent.nom}` : null;
        plain.adherent_email = adherent ? adherent.email : null;
        plain.adherent_telephone = adherent ? adherent.telephone : null;
      }
      return plain;
    }),
  );

  return isArray ? plains : plains[0];
}

module.exports = { withAdherentNames };
