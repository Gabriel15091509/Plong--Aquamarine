// Détection de chevauchement d'horaires entre deux sorties, utilisée pour
// interdire à un adhérent d'avoir deux inscriptions "Confirmée" simultanées.
// Volontairement basé sur l'intervalle réel [date_heure, date_heure +
// duree_estimee[ et non sur "même jour" : deux plongées dans la même
// journée sont une pratique normale (matin/après-midi) tant qu'elles ne se
// chevauchent pas dans le temps.

// duree_estimee est un DataTypes.TIME Sequelize, renvoyé en "HH:MM:SS".
function dureeEnMs(duree_estimee) {
  if (!duree_estimee) return 0;
  const [h = 0, m = 0, s = 0] = String(duree_estimee).split(":").map(Number);
  return ((h * 60 + m) * 60 + s) * 1000;
}

function getSortieInterval(sortie) {
  const debut = new Date(sortie.date_heure).getTime();
  const fin = debut + dureeEnMs(sortie.duree_estimee);
  return { debut, fin };
}

// Chevauchement strict d'intervalles semi-ouverts [début, fin[.
function sortiesSeChevauchent(sortieA, sortieB) {
  const a = getSortieInterval(sortieA);
  const b = getSortieInterval(sortieB);
  return a.debut < b.fin && b.debut < a.fin;
}

module.exports = { getSortieInterval, sortiesSeChevauchent };
