const path = require("path");
const PDFDocument = require("pdfkit");

const LOGO_PATH = path.join(__dirname, "../../assets/logo.png");
const BRAND = { start: "#06b6d4", mid: "#3b82f6", end: "#4f46e5" };
const INK = "#1a202c";
const MUTED = "#718096";
const FAINT = "#a0aec0";
const RULE = "#e2e8f0";

// Un gestionnaire de téléchargement (IDM "Advanced Integration") intercepte
// toute réponse HTTP reconnue comme un fichier binaire (Content-Type
// application/pdf, taille suffisante), quel que soit Content-Disposition —
// il rejoue alors la requête hors du contexte de la page (sans le token
// d'auth), ce qui fait échouer la promesse JS même si IDM récupère quand même
// le fichier. Pour éviter que le navigateur voie ne serait-ce qu'une réponse
// binaire, on renvoie le PDF encodé en base64 dans du JSON ; le frontend
// reconstruit lui-même le blob PDF et déclenche l'enregistrement.
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

function drawRow(doc, label, value) {
  doc
    .fontSize(11)
    .fillColor(MUTED)
    .text(label, { continued: true })
    .fillColor(INK)
    .text(`  ${value}`);
}

// Bandeau "Montant" mis en avant — c'est l'information que l'adhérent
// cherche en premier sur un reçu.
function drawMontantHighlight(doc, montant, statut) {
  const y = doc.y + 4;
  const boxHeight = 46;
  doc.rect(50, y, doc.page.width - 100, boxHeight).fill("#f0f9ff");
  doc
    .fillColor(MUTED)
    .font("Helvetica")
    .fontSize(10)
    .text("MONTANT", 65, y + 8);
  doc
    .fillColor(BRAND.mid)
    .font("Helvetica-Bold")
    .fontSize(22)
    .text(`${montant} €`, 65, y + 20);

  const statutColor = statut === "Payé" ? "#059669" : statut === "Annulé" ? "#dc2626" : "#d97706";
  doc
    .fillColor(statutColor)
    .font("Helvetica-Bold")
    .fontSize(12)
    .text(statut, 65, y + 16, { width: doc.page.width - 130, align: "right" });

  doc.font("Helvetica").fillColor(INK);
  doc.y = y + boxHeight + 15;
}

function drawFooter(doc) {
  // `doc.x` peut avoir été laissé loin à droite par la dernière ligne de
  // contenu positionnée en absolu : on le réinitialise à la marge gauche
  // pour que le centrage ci-dessous porte bien sur toute la largeur de la
  // page, pas sur ce qu'il en reste.
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

// Reçu de paiement générique — couvre adhésion / sortie / formation / caution.
async function streamRecuPaiement(res, { paiement, adherent, libelleReference }) {
  const doc = new PDFDocument({ margin: 50 });
  const filename = `recu-paiement-${paiement.id_paiement}.pdf`;

  drawHeader(
    doc,
    `Reçu de paiement n°${paiement.id_paiement}`,
    `Émis le ${new Date(paiement.date_paiement).toLocaleDateString("fr-FR")}`,
  );

  drawMontantHighlight(doc, paiement.montant, paiement.statut);

  drawRow(doc, "Adhérent :", `${adherent.civilite} ${adherent.nom} ${adherent.prenom}`);
  drawRow(doc, "Date :", new Date(paiement.date_paiement).toLocaleDateString("fr-FR"));
  drawRow(doc, "Type de paiement :", paiement.type_paiement);
  drawRow(doc, "Référence :", libelleReference || "-");
  drawRow(doc, "Mode :", paiement.mode);
  if (paiement.description) {
    doc.moveDown(0.5);
    drawRow(doc, "Description :", paiement.description);
  }

  drawFooter(doc);

  await sendPdfAsJson(res, doc, filename);
}

module.exports = {
  streamRecuPaiement,
};
