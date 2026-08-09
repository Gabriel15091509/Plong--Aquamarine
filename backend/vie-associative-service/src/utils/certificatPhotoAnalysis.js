const {
  normaliser,
  contientMot,
  dernierMotSignificatif,
  contientDate,
  extraireTexte,
  extraireDatesTriees,
  extraireMedecin,
} = require("./ocrCoherence");

// Compare le texte détecté par OCR sur la photo aux informations déjà
// saisies dans le formulaire. Ne renvoie jamais d'erreur bloquante : une
// correspondance à `null` signifie "non vérifiable" (champ absent ou trop
// court), à distinguer d'une correspondance à `false` (vérifiable mais
// absente de la photo).
async function analyserPhotoCertificat(buffer, { nom, prenom, medecin, dateValidite, dateDelivrance }) {
  const texte = await extraireTexte(buffer);
  const texteNormalise = normaliser(texte);

  const nomMedecin = dernierMotSignificatif(medecin);

  const correspondances = {
    nom: contientMot(texteNormalise, nom),
    prenom: contientMot(texteNormalise, prenom),
    medecin: nomMedecin ? contientMot(texteNormalise, nomMedecin) : null,
    date_validite: contientDate(texteNormalise, dateValidite),
    date_delivrance: contientDate(texteNormalise, dateDelivrance),
  };

  const avertissements = [];
  if (correspondances.nom === false && correspondances.prenom === false) {
    avertissements.push("Le nom et le prénom de l'adhérent n'apparaissent pas sur la photo.");
  }
  if (correspondances.medecin === false) {
    avertissements.push("Le nom du médecin n'apparaît pas sur la photo.");
  }
  if (correspondances.date_validite === false && correspondances.date_delivrance === false) {
    avertissements.push("Aucune des dates saisies n'apparaît sur la photo.");
  }

  // Extraction des autres champs (médecin, dates), utilisée par le frontend
  // pour pré-remplir automatiquement le formulaire une fois l'identité
  // confirmée (nom + prénom retrouvés sur la photo) — indépendant du
  // résultat de vérification ci-dessus, qui ne porte que sur ce qui est déjà
  // saisi.
  const datesDetectees = extraireDatesTriees(texte);
  const extraction = {
    medecin: extraireMedecin(texte),
    date_delivrance: datesDetectees.length >= 2 ? datesDetectees[0] : null,
    date_validite: datesDetectees.length >= 2 ? datesDetectees[datesDetectees.length - 1] : null,
  };

  const texteDetecte = texte.trim();
  return {
    correspondances,
    avertissements,
    coherent: avertissements.length === 0,
    texteDetecteVide: texteDetecte.length === 0,
    // Texte OCR brut, réutilisé par CertificatMedicalService.
    // judgeSubmittedDocument (validation automatique Ollama) — les
    // heuristiques ci-dessus servent de signal complémentaire, pas de
    // substitut au texte lui-même.
    texteDetecte,
    extraction,
  };
}

module.exports = { analyserPhotoCertificat };
