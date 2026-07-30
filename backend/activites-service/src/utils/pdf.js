const path = require("path");
const PDFDocument = require("pdfkit");

const LOGO_PATH = path.join(__dirname, "../../assets/logo.png");
const BRAND = { start: "#06b6d4", mid: "#3b82f6", end: "#4f46e5" };
const INK = "#1a202c";
const MUTED = "#718096";
const FAINT = "#a0aec0";
const RULE = "#e2e8f0";
const ROW_ALT = "#f8fafc";
const STAT_BG = "#f0f9ff";
const VALID_COLOR = "#059669";

// Même contournement que finance-service/vie-associative-service : un
// gestionnaire de téléchargement (IDM "Advanced Integration") intercepte
// toute réponse HTTP reconnue comme un fichier binaire (Content-Type
// application/pdf) et la rejoue hors du contexte de la page (sans le token
// d'auth). Le backend encode donc le PDF en base64 dans une réponse JSON ;
// le frontend reconstruit le blob PDF lui-même.
function renderPdfBuffer(doc) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });
}

async function sendPdfAsJson(res, doc, filename) {
  const buffer = await renderPdfBuffer(doc);
  res.json({ success: true, filename, data: buffer.toString("base64") });
}

// En-tête commune à tous les PDF du club : logo + titre du document, puis un
// filet dégradé aux couleurs de la marque en guise de séparateur.
function drawHeader(doc, title, subtitle) {
  const logoSize = 64;
  const logoX = 50;
  const logoY = 40;

  try {
    doc.image(LOGO_PATH, logoX, logoY, { width: logoSize, height: logoSize });
  } catch (error) {
    // Logo optionnel : une image manquante ne doit pas empêcher la
    // génération du document.
  }

  const textX = logoX + logoSize + 18;
  doc
    .fillColor(INK)
    .font("Helvetica-Bold")
    .fontSize(19)
    .text(title, textX, logoY + 6, { width: 340 });
  if (subtitle) {
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor(MUTED)
      .text(subtitle, textX, doc.y + 2, { width: 340 });
  }

  const barY = logoY + logoSize + 18;
  const gradient = doc.linearGradient(0, barY, doc.page.width, barY);
  gradient.stop(0, BRAND.start).stop(0.5, BRAND.mid).stop(1, BRAND.end);
  doc.rect(0, barY, doc.page.width, 5).fill(gradient);

  doc.font("Helvetica").fillColor(INK);
  doc.x = 50;
  doc.y = barY + 25;
}

// Titre de section avec un petit accent de couleur, plus marqué qu'un simple
// soulignement. La barre reprend exactement la hauteur de ligne que pdfkit
// calcule pour ce texte (`currentLineHeight`) plutôt qu'une valeur fixe
// devinée à l'œil : sinon elle ne correspond pas à la façon dont pdfkit
// positionne réellement le texte et flotte visiblement plus bas que lui.
function drawSectionTitle(doc, text) {
  const y = doc.y;
  doc.font("Helvetica-Bold").fontSize(13);
  const lineHeight = doc.currentLineHeight();
  doc.rect(50, y, 4, lineHeight).fill(BRAND.mid);
  doc.fillColor(INK).text(text, 62, y);
  doc.font("Helvetica");
  doc.moveDown(0.6);
}

// Trois pastilles chiffrées (nombre de plongées / profondeur max / temps
// total) — plus lisible qu'une liste de lignes label/valeur pour les
// agrégats qu'on veut voir en un coup d'œil.
function drawStatsBoxes(doc, stats) {
  const startY = doc.y + 4;
  const gap = 12;
  const totalWidth = doc.page.width - 100;
  const boxWidth = (totalWidth - gap * (stats.length - 1)) / stats.length;
  const boxHeight = 54;

  stats.forEach((stat, i) => {
    const x = 50 + i * (boxWidth + gap);
    doc.rect(x, startY, boxWidth, boxHeight).fill(STAT_BG);
    doc
      .fillColor(MUTED)
      .font("Helvetica")
      .fontSize(9)
      .text(stat.label.toUpperCase(), x + 12, startY + 10, { width: boxWidth - 24 });
    // Une valeur longue (ex. une période "JJ/MM/AAAA — JJ/MM/AAAA") ne tient
    // pas sur une ligne à 18pt dans un tiers de page : on réduit la taille
    // tant qu'elle ne rentre pas, plutôt que de laisser le texte déborder du
    // cadre en s'enroulant sur plusieurs lignes. Le bas du texte reste ancré
    // sur la même ligne de base quelle que soit la taille choisie, pour que
    // les trois valeurs de la rangée restent alignées entre elles.
    const availableWidth = boxWidth - 24;
    const targetBottom = startY + 26 + doc.font("Helvetica-Bold").fontSize(18).currentLineHeight();
    let valueFontSize = 18;
    doc.font("Helvetica-Bold");
    while (valueFontSize > 11 && doc.fontSize(valueFontSize).widthOfString(stat.value) > availableWidth) {
      valueFontSize -= 1;
    }
    const valueY = targetBottom - doc.fontSize(valueFontSize).currentLineHeight();
    doc
      .fillColor(BRAND.mid)
      .font("Helvetica-Bold")
      .fontSize(valueFontSize)
      .text(stat.value, x + 12, valueY, { width: availableWidth, lineBreak: false });
  });

  doc.font("Helvetica").fillColor(INK);
  doc.y = startY + boxHeight + 20;
}

// Ligne libellé/valeur pour un bloc d'informations formel (attestation).
function drawInfoRow(doc, label, value) {
  const y = doc.y;
  doc.font("Helvetica").fontSize(10).fillColor(MUTED).text(label, 50, y, {
    width: 190,
    lineBreak: false,
  });
  doc.font("Helvetica-Bold").fontSize(10).fillColor(INK).text(value, 250, y, {
    width: doc.page.width - 300,
    lineBreak: false,
  });
  doc.y = y + 18;
  doc.x = 50;
}

// Échelle à 5 points (façon jauge de visibilité d'un carnet de plongée
// papier) : pastilles pleines jusqu'au niveau atteint, vides au-delà.
// Ordre du moins bon au meilleur pour que "remplir jusqu'à" se lise
// naturellement de gauche à droite.
const VISIBILITE_ORDRE = ["Très mauvaise", "Mauvaise", "Moyenne", "Bonne", "Très bonne"];

function visibiliteLevel(visibilite) {
  const idx = VISIBILITE_ORDRE.indexOf(visibilite);
  return idx === -1 ? null : idx + 1;
}

function drawVisibiliteScale(doc, x, y, level) {
  doc
    .font("Helvetica-Bold")
    .fontSize(7.5)
    .fillColor(FAINT)
    .text("VISIBILITÉ", x, y - 11, { lineBreak: false });

  const dotR = 4.5;
  const gap = 15;
  for (let i = 1; i <= 5; i++) {
    const cx = x + (i - 1) * gap + dotR;
    const cy = y + dotR;
    doc.circle(cx, cy, dotR);
    if (level && i <= level) {
      doc.fillColor(BRAND.mid).fill();
    } else {
      doc.lineWidth(0.8).strokeColor(RULE).stroke();
    }
  }
  doc.fillColor(INK);
}

// Ligne de cases à cocher (façon check-list météo d'un carnet papier) pour
// le courant : une case par intensité possible, cochée pour celle relevée.
const COURANT_ORDRE = ["Nul", "Faible", "Modéré", "Fort", "Très fort"];
const COURANT_COL_WIDTH = 44;
const COURANT_BOX_SIZE = 7;

function drawCourantRow(doc, x, y, courant) {
  doc
    .font("Helvetica-Bold")
    .fontSize(7.5)
    .fillColor(FAINT)
    .text("COURANT", x, y - 11, { lineBreak: false });

  // Décalage vertical pour que le centre de la case (7pt) coïncide avec le
  // centre des pastilles de visibilité (9pt de diamètre, dessinées à partir
  // du même y) — sans ce +1, les cases paraissent "remontées" d'un point par
  // rapport aux pastilles alignées sur la ligne du dessus.
  const boxY = y + 1;
  COURANT_ORDRE.forEach((opt, i) => {
    const colX = x + i * COURANT_COL_WIDTH;
    const checked = opt === courant;
    doc
      .rect(colX, boxY, COURANT_BOX_SIZE, COURANT_BOX_SIZE)
      .lineWidth(0.8)
      .strokeColor(checked ? BRAND.mid : RULE)
      .stroke();
    if (checked) {
      doc
        .moveTo(colX + 1, boxY + 3.5)
        .lineTo(colX + 2.8, boxY + 6)
        .lineTo(colX + 6.2, boxY + 1)
        .lineWidth(1.1)
        .strokeColor(BRAND.mid)
        .stroke();
    }
    doc
      .font("Helvetica")
      .fontSize(6.5)
      .fillColor(checked ? INK : FAINT)
      .text(opt, colX + COURANT_BOX_SIZE + 2, boxY + 0.5, {
        width: COURANT_COL_WIDTH - COURANT_BOX_SIZE - 3,
        lineBreak: false,
      });
  });
  doc.fillColor(INK);
}

const STAT_VALUE_FONT_SIZE = 11;

// `doc.currentLineHeight()` est la métrique exacte que pdfkit utilise en
// interne pour positionner une ligne de texte (contrairement à un ratio
// approximatif dérivé visuellement, qui diverge selon la taille de police).
// Elle sert ici à faire coïncider le bas de plusieurs valeurs de tailles
// différentes sur une même rangée : sans ça, une valeur affichée plus petite
// (ex. réduite pour tenir dans sa largeur) paraît "flotter" plus haut ou plus
// bas que ses voisines au lieu de partager leur ligne de base.
function statValueBottom(doc, y) {
  doc.font("Helvetica-Bold").fontSize(STAT_VALUE_FONT_SIZE);
  return y + 10 + doc.currentLineHeight();
}

function drawStat(doc, x, y, label, value) {
  doc
    .font("Helvetica-Bold")
    .fontSize(7.5)
    .fillColor(FAINT)
    .text(label.toUpperCase(), x, y, { lineBreak: false });
  doc
    .font("Helvetica-Bold")
    .fontSize(STAT_VALUE_FONT_SIZE)
    .fillColor(INK)
    .text(value, x, y + 10, { lineBreak: false });
}

// Variante utilisée pour une valeur qui peut être trop longue pour tenir sur
// une ligne à la taille standard (ex. le type de plongée) : réduit la taille
// jusqu'à ce qu'elle rentre, en ancrant le bas du texte sur la même ligne de
// base que les valeurs voisines (plutôt que de garder un y de départ fixe,
// ce qui ferait paraître cette valeur plus haute ou plus basse que les
// autres selon sa taille de police).
function drawStatFit(doc, x, maxWidth, y, label, value) {
  doc
    .font("Helvetica-Bold")
    .fontSize(7.5)
    .fillColor(FAINT)
    .text(label.toUpperCase(), x, y, { lineBreak: false });

  const targetBottom = statValueBottom(doc, y);
  let fontSize = STAT_VALUE_FONT_SIZE;
  doc.font("Helvetica");
  while (fontSize > 7 && doc.fontSize(fontSize).widthOfString(value) > maxWidth) {
    fontSize -= 0.5;
  }
  doc.fontSize(fontSize);
  const valueY = targetBottom - doc.currentLineHeight();
  doc
    .font("Helvetica")
    .fontSize(fontSize)
    .fillColor(INK)
    .text(value, x, valueY, { lineBreak: false });
}

// 91 (et non un chiffre rond comme 96) : mesuré pour que la marge sous la
// dernière rangée (jauges visibilité/courant) égale la marge au-dessus de la
// date/site — sans ça le contenu paraît "collé" en haut de la carte avec un
// vide net en bas.
const DIVE_CARD_HEIGHT = 91;
const DIVE_CARD_GAP = 10;

// Une carte par plongée — reprend l'esprit d'une page de carnet de plongée
// papier (encart date/site, jauge de visibilité, case à cocher courant)
// plutôt qu'une simple ligne de tableau.
function drawDiveCard(doc, plongee, y) {
  const x = 50;
  const width = doc.page.width - 100;

  doc.roundedRect(x, y, width, DIVE_CARD_HEIGHT, 5).lineWidth(0.8).strokeColor(RULE).stroke();

  const site = plongee.sortie?.site || plongee.sortie?.lieu || "Site non renseigné";
  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor(INK)
    .text(new Date(plongee.date).toLocaleDateString("fr-FR"), x + 14, y + 12, {
      lineBreak: false,
    });
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(MUTED)
    .text(site, x + 105, y + 14, { width: 230, lineBreak: false });

  const validated = !!plongee.id_moniteur_validateur;
  doc
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor(validated ? VALID_COLOR : FAINT)
    .text(validated ? "VALIDÉE" : "NON VALIDÉE", x + width - 116, y + 14, {
      width: 102,
      align: "right",
    });

  drawStat(doc, x + 14, y + 38, "Profondeur", `${plongee.profondeur_max ?? "-"} m`);
  drawStat(doc, x + 130, y + 38, "Durée", `${plongee.duree ?? "-"} min`);
  drawStat(
    doc,
    x + 230,
    y + 38,
    "Temp. eau",
    plongee.temperature_eau != null ? `${plongee.temperature_eau} °C` : "-",
  );
  drawStatFit(doc, x + 330, width - 344, y + 38, "Type", plongee.type_plongee);

  drawVisibiliteScale(doc, x + 14, y + 74, visibiliteLevel(plongee.visibilite));
  drawCourantRow(doc, x + 150, y + 74, plongee.courant);

  doc.font("Helvetica").fillColor(INK);
}

function drawFooter(doc) {
  // `doc.x` peut avoir été laissé loin à droite par la dernière ligne de
  // contenu positionnée en absolu (ex. le tableau du carnet de plongée) :
  // on le réinitialise à la marge gauche pour que le centrage ci-dessous
  // porte bien sur toute la largeur de la page, pas sur ce qu'il en reste.
  doc.x = 50;
  doc.moveDown(1.5);
  const y = doc.y;
  doc
    .moveTo(50, y)
    .lineTo(doc.page.width - 50, y)
    .lineWidth(0.5)
    .strokeColor(RULE)
    .stroke();
  doc
    .moveDown(0.8)
    .fontSize(9)
    .fillColor(FAINT)
    .font("Helvetica")
    .text(
      `Document généré le ${new Date().toLocaleDateString("fr-FR")} — Aquanature Plongée, club de plongée, Saint-Leu, La Réunion.`,
      50,
      doc.y,
      { width: doc.page.width - 100, align: "center" },
    );
}

// Bloc signature/cachet — bas de page des documents formels (attestations),
// à la manière d'une fiche officielle du club.
function drawSignatureBlock(doc) {
  doc.x = 50;
  const dateY = doc.y;
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor(MUTED)
    .text(`Fait à Saint-Leu, La Réunion, le ${new Date().toLocaleDateString("fr-FR")}`, 50, dateY);

  const lineY = dateY + 46;
  const lineX = doc.page.width - 220;
  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(INK)
    .text("Le Président", lineX, dateY, { width: 170, align: "center" });
  doc
    .moveTo(lineX, lineY)
    .lineTo(doc.page.width - 50, lineY)
    .lineWidth(0.8)
    .strokeColor(RULE)
    .stroke();
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(FAINT)
    .text("Signature et cachet du club", lineX, lineY + 5, { width: 170, align: "center" });

  doc.x = 50;
  doc.y = lineY + 25;
}

// Carnet de plongée (CDC 3.3.3) : une carte par plongée (date, site,
// profondeur/durée/température, visibilité et courant relevés) précédée
// d'un récapitulatif d'agrégats, pour présentation à un autre club.
async function streamCarnetPlongee(res, { adherent, plongees, profondeurMax, dureeTotale }) {
  const doc = new PDFDocument({ margin: 50 });
  const filename = `carnet-plongee-${adherent.num_adherent}.pdf`;

  drawHeader(
    doc,
    "Carnet de plongée",
    `${adherent.civilite} ${adherent.nom} ${adherent.prenom} — Niveau ${adherent.niveau || "-"}`,
  );

  drawStatsBoxes(doc, [
    { label: "Plongées", value: String(plongees.length) },
    { label: "Profondeur max", value: `${profondeurMax} m` },
    { label: "Temps sous l'eau", value: `${dureeTotale} min` },
  ]);

  drawSectionTitle(doc, "Historique des plongées");

  if (plongees.length === 0) {
    doc.font("Helvetica").fontSize(10).fillColor(MUTED).text("Aucune plongée enregistrée.");
  } else {
    let y = doc.y + 2;
    plongees.forEach((p) => {
      if (y + DIVE_CARD_HEIGHT > 740) {
        doc.addPage();
        y = 50;
      }
      drawDiveCard(doc, p, y);
      y += DIVE_CARD_HEIGHT + DIVE_CARD_GAP;
    });
    doc.x = 50;
    doc.y = y;
  }

  drawFooter(doc);

  await sendPdfAsJson(res, doc, filename);
}

// Attestation de suivi de plongée : récapitulatif formel de l'expérience de
// l'adhérent (plongées validées par un moniteur, profondeur max, période
// couverte) à présenter à un autre club, la FFESM ou un assureur —
// complément officiel du carnet, qui reste un journal détaillé.
async function streamAttestationSuiviPlongee(
  res,
  { adherent, nbPlongees, profondeurMax, dateDebut, dateFin },
) {
  const doc = new PDFDocument({ margin: 50 });
  const filename = `attestation-suivi-plongee-${adherent.num_adherent}.pdf`;

  drawHeader(
    doc,
    "Attestation de suivi de plongée",
    `${adherent.civilite} ${adherent.nom} ${adherent.prenom} — N°${adherent.num_adherent}`,
  );

  drawSectionTitle(doc, "Informations personnelles");
  drawInfoRow(doc, "Nom et prénom", `${adherent.civilite} ${adherent.nom} ${adherent.prenom}`);
  drawInfoRow(
    doc,
    "Date de naissance",
    adherent.date_naissance
      ? new Date(adherent.date_naissance).toLocaleDateString("fr-FR")
      : "-",
  );
  drawInfoRow(doc, "Niveau", adherent.niveau || "-");
  drawInfoRow(
    doc,
    "Date d'obtention du niveau",
    adherent.date_obtention_niveau
      ? new Date(adherent.date_obtention_niveau).toLocaleDateString("fr-FR")
      : "-",
  );
  doc.moveDown(0.6);

  drawSectionTitle(doc, "Récapitulatif d'expérience");
  const periodeLabel =
    dateDebut && dateFin
      ? `${dateDebut.toLocaleDateString("fr-FR")} — ${dateFin.toLocaleDateString("fr-FR")}`
      : "-";
  drawStatsBoxes(doc, [
    { label: "Plongées validées", value: String(nbPlongees) },
    { label: "Profondeur max", value: profondeurMax != null ? `${profondeurMax} m` : "-" },
    { label: "Période couverte", value: periodeLabel },
  ]);

  drawSectionTitle(doc, "Attestation");
  const periodeTexte =
    dateDebut && dateFin
      ? ` entre le ${dateDebut.toLocaleDateString("fr-FR")} et le ${dateFin.toLocaleDateString("fr-FR")}`
      : "";
  doc
    .font("Helvetica")
    .fontSize(11)
    .fillColor(INK)
    .text(
      `Le club Aquanature Plongée atteste que ${adherent.civilite} ${adherent.nom} ${adherent.prenom}, ` +
        `titulaire du niveau ${adherent.niveau || "non renseigné"}, a réalisé ${nbPlongees} plongée(s) ` +
        `encadrée(s) par le club${periodeTexte}, avec une profondeur maximale atteinte de ` +
        `${profondeurMax != null ? profondeurMax + " mètres" : "non renseignée"}.`,
      { width: doc.page.width - 100, align: "justify" },
    );
  doc.moveDown(2.5);

  drawSignatureBlock(doc);

  drawFooter(doc);

  await sendPdfAsJson(res, doc, filename);
}

module.exports = {
  streamCarnetPlongee,
  streamAttestationSuiviPlongee,
};
