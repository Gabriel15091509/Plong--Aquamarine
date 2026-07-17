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
// soulignement.
function drawSectionTitle(doc, text) {
  const y = doc.y;
  doc.rect(50, y + 3, 4, 13).fill(BRAND.mid);
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(13).text(text, 62, y);
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
    doc
      .fillColor(BRAND.mid)
      .font("Helvetica-Bold")
      .fontSize(18)
      .text(stat.value, x + 12, startY + 26, { width: boxWidth - 24 });
  });

  doc.font("Helvetica").fillColor(INK);
  doc.y = startY + boxHeight + 20;
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

// Carnet de plongée (CDC 3.3.3) : une ligne par plongée + un récapitulatif
// des agrégats en tête, pour présentation à un autre club.
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

  const rowHeight = 20;
  let rowY = doc.y + 4;
  plongees.forEach((p, idx) => {
    if (rowY > 720) {
      doc.addPage();
      rowY = 50;
    }
    if (idx % 2 === 0) {
      doc.rect(50, rowY, doc.page.width - 100, rowHeight).fill(ROW_ALT);
    }
    doc
      .fillColor(INK)
      .font("Helvetica")
      .fontSize(10)
      .text(
        `${new Date(p.date).toLocaleDateString("fr-FR")}   ${p.type_plongee}   ${p.profondeur_max} m / ${p.duree} min`,
        58,
        rowY + 5,
        { width: doc.page.width - 210, lineBreak: false },
      );
    const validated = !!p.id_moniteur_validateur;
    doc
      .fillColor(validated ? "#059669" : FAINT)
      .font("Helvetica-Bold")
      .fontSize(9)
      .text(validated ? "Validée" : "Non validée", doc.page.width - 150, rowY + 6, {
        width: 100,
        align: "right",
      });
    rowY += rowHeight;
  });
  doc.font("Helvetica").fillColor(INK);
  doc.y = rowY + 10;

  drawFooter(doc);

  await sendPdfAsJson(res, doc, filename);
}

module.exports = {
  streamCarnetPlongee,
};
