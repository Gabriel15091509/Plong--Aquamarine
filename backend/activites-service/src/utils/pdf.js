const PDFDocument = require("pdfkit");

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

function drawHeader(doc, title) {
  doc
    .fillColor("#3b82f6")
    .fontSize(20)
    .text("Aquanature Plongée", { align: "left" })
    .fontSize(12)
    .fillColor("#718096")
    .text("Club de plongée")
    .moveDown(1)
    .fillColor("#1a202c")
    .fontSize(16)
    .text(title, { underline: true })
    .moveDown(1);
}

// Carnet de plongée (CDC 3.3.3) : une ligne par plongée + un récapitulatif
// des agrégats en tête, pour présentation à un autre club.
async function streamCarnetPlongee(res, { adherent, plongees, profondeurMax, dureeTotale }) {
  const doc = new PDFDocument({ margin: 50 });
  const filename = `carnet-plongee-${adherent.num_adherent}.pdf`;

  drawHeader(doc, `Carnet de plongée — ${adherent.civilite} ${adherent.nom} ${adherent.prenom}`);

  doc
    .fontSize(11)
    .fillColor("#718096")
    .text(`Niveau : `, { continued: true })
    .fillColor("#1a202c")
    .text(adherent.niveau || "-");
  doc
    .fillColor("#718096")
    .text(`Nombre de plongées : `, { continued: true })
    .fillColor("#1a202c")
    .text(String(plongees.length));
  doc
    .fillColor("#718096")
    .text(`Profondeur maximale réalisée : `, { continued: true })
    .fillColor("#1a202c")
    .text(`${profondeurMax} m`);
  doc
    .fillColor("#718096")
    .text(`Temps total sous l'eau : `, { continued: true })
    .fillColor("#1a202c")
    .text(`${dureeTotale} minutes`);

  doc.moveDown(1.5);

  for (const p of plongees) {
    doc
      .fontSize(10)
      .fillColor("#1a202c")
      .text(
        `${new Date(p.date).toLocaleDateString("fr-FR")} — ${p.type_plongee} — ` +
          `${p.profondeur_max} m / ${p.duree} min` +
          (p.id_moniteur_validateur ? " (validée)" : " (non validée)"),
      );
    if (doc.y > 700) doc.addPage();
  }

  doc.moveDown(2);
  doc
    .fontSize(10)
    .fillColor("#a0aec0")
    .text(`Document généré le ${new Date().toLocaleDateString("fr-FR")}.`);

  await sendPdfAsJson(res, doc, filename);
}

module.exports = {
  streamCarnetPlongee,
};
