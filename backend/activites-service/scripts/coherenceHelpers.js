// Génération COHÉRENTE des palanquées / compositions / plongées d'une sortie,
// partagée par seedActivites.js (nouvelles données) et
// repairCoherenceActivites.js (base déjà seedée). Les invariants respectés
// sont ceux que l'application impose en usage réel :
//  - seuls des plongeurs inscrits "Confirmée" ET pointés présents sont
//    composés en palanquée (donc jamais plus que les places de la sortie :
//    "Confirmée" ≤ nb_places, voir InscriptionWaitlistService) ;
//  - un adhérent n'est que dans UNE palanquée d'une même sortie ;
//  - une palanquée respecte le ratio encadrant/plongeur de
//    PalanqueeService.computeMaxRatio (4 si un membre est Baptême/Niveau 1,
//    sinon 6) ;
//  - les noms de palanquée sont uniques par sortie (A, B, C…) ;
//  - l'encadrant est un des moniteurs désignés sur la sortie.
"use strict";

const { randomInt, randomFloat, pick, pickMultiple, randomSentence } = require("../../scripts/seedHelpers");

// Miroir de NIVEAUX_LIMITANTS dans src/services/PalanqueeService.js.
const NIVEAUX_LIMITANTS = ["Baptême", "Niveau 1"];
const NIVEAUX_EXPERIMENTES = ["Niveau 3", "Niveau 4", "Moniteur"];
const VISIBILITES = ["Très bonne", "Bonne", "Moyenne", "Mauvaise"];
const COURANTS = ["Nul", "Faible", "Modéré", "Fort"];

function ratioMax(niveaux) {
  return niveaux.some((n) => NIVEAUX_LIMITANTS.includes(n)) ? 4 : 6;
}

// membres : [{ num_adherent, niveau }]. Les niveaux limitants sont regroupés
// en premier : leurs palanquées plafonnent à 4, les autres profitent du
// ratio de 6 au lieu d'être bridées par un seul débutant.
function grouperEnPalanquees(membres) {
  const tries = [...membres].sort(
    (a, b) =>
      Number(NIVEAUX_LIMITANTS.includes(b.niveau)) - Number(NIVEAUX_LIMITANTS.includes(a.niveau)),
  );
  const groupes = [];
  let courant = [];
  for (const membre of tries) {
    const niveaux = [...courant.map((m) => m.niveau), membre.niveau];
    if (courant.length > 0 && courant.length + 1 > ratioMax(niveaux)) {
      groupes.push(courant);
      courant = [];
    }
    courant.push(membre);
  }
  if (courant.length > 0) groupes.push(courant);
  return groupes;
}

function nomPalanquee(index) {
  return `Palanquée ${index < 26 ? String.fromCharCode(65 + index) : index + 1}`;
}

// sortie : { id_sortie, statut, date_heure, profondeur_max, encadrants[] }
// presents : [{ num_adherent, niveau }] déjà filtrés (Confirmée + présent).
// Retourne [{ palanquee: <ligne Palanquee sans id>, membres: [...] }].
function construirePalanquees(sortie, presents) {
  if (presents.length === 0) return [];
  const terminee = sortie.statut === "Terminée";
  const profondeurSortie = sortie.profondeur_max || 20;
  const encadrants = Array.isArray(sortie.encadrants) ? sortie.encadrants : [];

  return grouperEnPalanquees(presents).map((membres, index) => {
    const experimentes = membres.filter((m) => NIVEAUX_EXPERIMENTES.includes(m.niveau));
    return {
      palanquee: {
        id_sortie: sortie.id_sortie,
        nom_palanquee: nomPalanquee(index),
        id_moniteur_encadrant: encadrants.length > 0 ? pick(encadrants) : null,
        profondeur_max_realisee: terminee ? Math.min(randomInt(5, 38), profondeurSortie) : null,
        duree_reelle: terminee ? randomInt(25, 60) : null,
        id_guide_palanquee: experimentes.length > 0 ? pick(experimentes).num_adherent : null,
        id_secouriste:
          experimentes.length > 1 ? pickMultiple(experimentes, 1, 1)[0].num_adherent : null,
        statut: terminee ? "Terminée" : "En cours",
        date_cloture: terminee ? sortie.date_heure : null,
      },
      membres,
    };
  });
}

function construirePlongee(sortie, palanquee, membre) {
  const terminee = sortie.statut === "Terminée";
  const encadrants = Array.isArray(sortie.encadrants) ? sortie.encadrants : [];
  return {
    num_adherent: membre.num_adherent,
    id_sortie: sortie.id_sortie,
    id_palanquee: palanquee.id_palanquee,
    date: sortie.date_heure,
    profondeur_max: terminee
      ? Math.min(randomInt(5, 38), sortie.profondeur_max || 20)
      : null,
    duree: terminee ? randomInt(25, 60) : null,
    temperature_eau: terminee ? randomFloat(19, 28, 1) : null,
    visibilite: terminee ? pick(VISIBILITES) : null,
    courant: terminee ? pick(COURANTS) : null,
    type_plongee: sortie.type,
    observations_faune: terminee && Math.random() > 0.3 ? randomSentence(6, 16) : null,
    id_moniteur_validateur:
      terminee && encadrants.length > 0 && Math.random() > 0.25 ? pick(encadrants) : null,
  };
}

module.exports = {
  NIVEAUX_LIMITANTS,
  ratioMax,
  grouperEnPalanquees,
  nomPalanquee,
  construirePalanquees,
  construirePlongee,
};
