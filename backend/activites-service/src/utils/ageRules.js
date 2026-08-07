// Règles d'encadrement liées à l'âge du plongeur, prévues par le Code du
// Sport (art. R.322-71 et arrêté du 22/06/1998 relatif aux normes
// techniques applicables à l'enseignement de la plongée). Volontairement
// limité aux deux règles explicites et non ambiguës utiles à ce club — pas
// de courbe d'âge/profondeur complète en autonomie (PE/PA), qui dépend de
// paramètres non modélisés ici (encadrement réel sur place, spécialité du
// moniteur, etc.) et mérite une vérification humaine plutôt qu'un blocage
// mécanique approximatif.

// Baptême de plongée : profondeur max selon l'âge. Bandes non chevauchantes
// (8-9 ans → 2m, 10-13 ans → 3m) ; en dessous de 8 ans, aucun baptême en
// milieu naturel (pas de zone déclarée dans la réglementation).
const BAPTEME_PROFONDEUR_PAR_AGE = [
  { min: 8, max: 9, profondeurMax: 2 },
  { min: 10, max: 13, profondeurMax: 3 },
];

function getAge(date_naissance, atDate = new Date()) {
  if (!date_naissance) return null;
  const naissance = new Date(date_naissance);
  if (isNaN(naissance.getTime())) return null;
  let age = atDate.getFullYear() - naissance.getFullYear();
  const pasEncoreAnniversaire =
    atDate.getMonth() < naissance.getMonth() ||
    (atDate.getMonth() === naissance.getMonth() && atDate.getDate() < naissance.getDate());
  if (pasEncoreAnniversaire) age -= 1;
  return age;
}

// Renvoie un message d'erreur si la profondeur prévue pour un baptême excède
// la limite légale pour l'âge de l'adhérent, ou null si c'est conforme (y
// compris quand l'âge est inconnu ou que ce n'est pas un baptême — on ne
// bloque jamais sur une donnée absente, seulement sur une violation avérée).
function checkBaptemeDepthForAge(age, profondeurMaxSortie) {
  if (age === null || age === undefined) return null;
  if (age < 8) {
    return "Baptême non autorisé en dessous de 8 ans";
  }
  const bande = BAPTEME_PROFONDEUR_PAR_AGE.find((b) => age >= b.min && age <= b.max);
  if (!bande) return null; // 14 ans et plus : pas de plafond spécifique au baptême
  if (Number(profondeurMaxSortie) > bande.profondeurMax) {
    return `Profondeur maximale de ${bande.profondeurMax}m pour un baptême à ${age} ans (sortie prévue à ${profondeurMaxSortie}m)`;
  }
  return null;
}

function isSameCalendarDay(dateA, dateB) {
  const a = new Date(dateA);
  const b = new Date(dateB);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// Un enfant de moins de 12 ans ne peut faire qu'une plongée par jour.
const AGE_LIMITE_UNE_PLONGEE_PAR_JOUR = 12;

module.exports = {
  getAge,
  checkBaptemeDepthForAge,
  isSameCalendarDay,
  AGE_LIMITE_UNE_PLONGEE_PAR_JOUR,
};
