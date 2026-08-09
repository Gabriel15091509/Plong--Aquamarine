const {
  normaliser,
  contientMot,
  contientAlphanumerique,
  contientDate,
  extraireTexte,
  extraireDatesTriees,
  extraireNumeroLicenceFFESM,
} = require("./ocrCoherence");

// Même principe que certificatPhotoAnalysis.js, appliqué aux documents
// d'adhésion (licence FFESM, assurance RC...) : compare le texte détecté par
// OCR sur la photo aux informations déjà saisies. Le n° de licence FFESM
// n'est vérifié que pour le type "FFESM" (les autres types n'en portent pas).
async function analyserPhotoAdhesion(buffer, { nom, prenom, type, num_licence_ffesm, date_debut, date_fin }) {
  const texte = await extraireTexte(buffer);
  const texteNormalise = normaliser(texte);

  const correspondances = {
    nom: contientMot(texteNormalise, nom),
    prenom: contientMot(texteNormalise, prenom),
    num_licence_ffesm:
      type === "FFESM" && num_licence_ffesm
        ? contientAlphanumerique(texteNormalise, num_licence_ffesm)
        : null,
    date_debut: contientDate(texteNormalise, date_debut),
    date_fin: contientDate(texteNormalise, date_fin),
  };

  const avertissements = [];
  if (correspondances.nom === false && correspondances.prenom === false) {
    avertissements.push("Le nom et le prénom de l'adhérent n'apparaissent pas sur la photo.");
  }
  if (correspondances.num_licence_ffesm === false) {
    avertissements.push("Le numéro de licence FFESM saisi n'apparaît pas sur la photo.");
  }
  if (correspondances.date_debut === false && correspondances.date_fin === false) {
    avertissements.push("Aucune des dates saisies n'apparaît sur la photo.");
  }

  // Extraction des autres champs (n° de licence, dates), utilisée par le
  // frontend pour pré-remplir automatiquement le formulaire une fois
  // l'identité confirmée (nom + prénom retrouvés sur la photo).
  const datesDetectees = extraireDatesTriees(texte);
  const extraction = {
    num_licence_ffesm: type === "FFESM" ? extraireNumeroLicenceFFESM(texte) : null,
    date_debut: datesDetectees.length >= 2 ? datesDetectees[0] : null,
    date_fin: datesDetectees.length >= 2 ? datesDetectees[datesDetectees.length - 1] : null,
  };

  const texteDetecte = texte.trim();
  return {
    correspondances,
    avertissements,
    coherent: avertissements.length === 0,
    texteDetecteVide: texteDetecte.length === 0,
    // Texte OCR brut, réutilisé par AdhesionService.judgeSubmittedDocument
    // (validation automatique Ollama) — les heuristiques ci-dessus servent
    // de signal complémentaire, pas de substitut au texte lui-même.
    texteDetecte,
    extraction,
  };
}

module.exports = { analyserPhotoAdhesion };
