const { createWorker } = require("tesseract.js");

// Briques communes de vérification "un peu" de cohérence entre une photo
// (webcam ou import) et des informations déjà saisies dans un formulaire —
// utilisées à la fois pour le certificat médical et l'adhésion (licence
// FFESM, assurance RC). Jamais une lecture fiable à 100% (document
// manuscrit/tamponné), donc toujours non bloquant côté appelant.
function normaliser(texte) {
  return (texte || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase();
}

function contientMot(texteNormalise, mot) {
  const motNormalise = normaliser(mot).trim();
  if (motNormalise.length < 2) return null; // trop court pour être significatif
  return texteNormalise.includes(motNormalise);
}

// Comparaison "numéro/référence" (ex. n° de licence FFESM) : ignore espaces
// et tirets, l'OCR et la saisie manuelle ne les plaçant pas forcément aux
// mêmes endroits (ex. "FF 12345" saisi vs "FF12345" imprimé).
function contientAlphanumerique(texteNormalise, valeur) {
  const nettoye = normaliser(valeur).replace(/[^A-Z0-9]/g, "");
  if (nettoye.length < 3) return null; // trop court pour être significatif
  const texteNettoye = texteNormalise.replace(/[^A-Z0-9]/g, "");
  return texteNettoye.includes(nettoye);
}

// Le champ "médecin" est saisi en texte libre (ex. "Dr. Martin Dupont") :
// on ne vérifie que le dernier mot (le nom de famille, le plus susceptible
// de figurer tel quel sur un tampon) plutôt que la chaîne complète, qui elle
// contiendrait "Dr" et ne matcherait presque jamais mot pour mot.
function dernierMotSignificatif(chaine) {
  const mots = (chaine || "").trim().split(/\s+/).filter((m) => m.length >= 3);
  return mots.length ? mots[mots.length - 1] : null;
}

function formatsDate(dateIso) {
  if (!dateIso) return [];
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return [];
  const jj = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const aaaa = String(d.getFullYear());
  return [`${jj}/${mm}/${aaaa}`, `${jj}-${mm}-${aaaa}`, `${jj}.${mm}.${aaaa}`];
}

function contientDate(texteNormalise, dateIso) {
  const formats = formatsDate(dateIso);
  if (!formats.length) return null;
  return formats.some((f) => texteNormalise.includes(f));
}

async function extraireTexte(buffer) {
  const worker = await createWorker("fra");
  try {
    const {
      data: { text },
    } = await worker.recognize(buffer);
    return text;
  } finally {
    await worker.terminate();
  }
}

// --- Extraction de valeurs (pas seulement vérification) ---------------
// Utilisé pour pré-remplir automatiquement les champs du formulaire une fois
// l'identité de l'adhérent confirmée (nom + prénom retrouvés sur la photo) :
// on tente alors de lire les *autres* informations (médecin, dates, n° de
// licence) directement depuis le texte OCR, pour éviter une re-saisie.

function lignesSignificatives(texte) {
  return (texte || "")
    .split(/\r?\n/)
    .map((ligne) => ligne.trim())
    .filter(Boolean);
}

// Cherche la valeur associée à un label : sur la même ligne juste après le
// label, sinon sur la ligne suivante — mise en page la plus courante sur une
// carte/licence (label au-dessus ou juste avant la valeur).
function valeurApresLabel(lignes, motsClefs, { minLength = 2 } = {}) {
  for (let i = 0; i < lignes.length; i++) {
    const ligneNormalisee = normaliser(lignes[i]);
    const motTrouve = motsClefs.find((mc) => ligneNormalisee.includes(mc));
    if (!motTrouve) continue;
    const indexFin = ligneNormalisee.indexOf(motTrouve) + motTrouve.length;
    const resteMemeLigne = lignes[i].slice(indexFin).replace(/^[\s:.-]+/, "").trim();
    if (resteMemeLigne.length >= minLength) return resteMemeLigne;
    if (lignes[i + 1] && lignes[i + 1].length >= minLength) return lignes[i + 1];
  }
  return null;
}

// Toutes les dates détectées dans le texte (n'importe quel format usuel),
// triées chronologiquement — pas d'ancrage sur un label, une date se
// reconnaît par sa forme, peu importe la mise en page du document.
function extraireDatesTriees(texte) {
  const regex = /\b(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})\b/g;
  const dates = new Set();
  let correspondance;
  while ((correspondance = regex.exec(texte || ""))) {
    const jour = parseInt(correspondance[1], 10);
    const mois = parseInt(correspondance[2], 10);
    const annee = parseInt(correspondance[3], 10);
    if (mois < 1 || mois > 12 || jour < 1 || jour > 31) continue;
    dates.add(`${annee}-${String(mois).padStart(2, "0")}-${String(jour).padStart(2, "0")}`);
  }
  return Array.from(dates).sort();
}

// Le médecin est presque toujours précédé de "Dr" sur un vrai certificat —
// bien plus fiable que de deviner via un label "MEDECIN" (souvent absent du
// document réel, contrairement à notre carte de démo).
function extraireMedecin(texte) {
  // `[ \t]+` (pas `\s+`) entre les mots du nom : ne doit jamais franchir un
  // saut de ligne, sous peine d'avaler le début du champ suivant sur la
  // ligne d'après (ex. "Dr. Martin Dupont\nDATE DE..." -> capturerait
  // "Martin Dupont DATE DE").
  const correspondance = (texte || "").match(
    /\bDr\.?[ \t]+([A-Za-zÀ-ÖØ-öø-ÿ'-]+(?:[ \t]+[A-Za-zÀ-ÖØ-öø-ÿ'-]+){0,3})/,
  );
  if (correspondance) return `Dr. ${correspondance[1].trim()}`;
  const valeur = valeurApresLabel(lignesSignificatives(texte), ["MEDECIN", "DOCTEUR"]);
  return valeur || null;
}

// Convention du club (voir les licences déjà en base) : "FF" suivi de 4 à 6
// chiffres — recherché en priorité car sans ambiguïté ; à défaut, on
// retombe sur la valeur associée au label "n° de licence".
function extraireNumeroLicenceFFESM(texte) {
  const correspondanceDirecte = (texte || "").match(/\bFF[\s-]?(\d{4,6})\b/i);
  if (correspondanceDirecte) return `FF${correspondanceDirecte[1]}`;
  const valeur = valeurApresLabel(lignesSignificatives(texte), [
    "N DE LICENCE",
    "N° LICENCE",
    "NUMERO DE LICENCE",
    "N LICENCE",
  ]);
  if (!valeur) return null;
  const nettoye = valeur.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  return nettoye.length >= 4 ? nettoye : null;
}

module.exports = {
  normaliser,
  contientMot,
  contientAlphanumerique,
  dernierMotSignificatif,
  formatsDate,
  contientDate,
  extraireTexte,
  extraireDatesTriees,
  extraireMedecin,
  extraireNumeroLicenceFFESM,
};
