// Traduit une SequelizeUniqueConstraintError en message français lisible,
// selon la colonne réellement en conflit — plutôt qu'un message générique
// ("cet email") qui devient trompeur dès qu'une autre colonne unique
// (ex. num_licence_ffesm) peut aussi déclencher cette même erreur.
const FIELD_LABELS = {
  email: "cet email",
  num_licence_ffesm: "ce numéro de licence FFESM",
  num_adherent: "ce numéro d'adhérent",
};

function friendlyUniqueConstraintMessage(error) {
  const path = error.errors?.[0]?.path;
  const label = FIELD_LABELS[path] || "une de ces valeurs";
  return `Un autre adhérent utilise déjà ${label}`;
}

module.exports = { friendlyUniqueConstraintMessage };
