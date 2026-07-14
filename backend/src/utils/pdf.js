const PDFDocument = require("pdfkit");

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

function drawRow(doc, label, value) {
  doc
    .fontSize(11)
    .fillColor("#718096")
    .text(label, { continued: true })
    .fillColor("#1a202c")
    .text(`  ${value}`);
}

// Attestation d'adhésion : récapitule les lignes d'adhésion de l'adhérent
// pour l'année donnée et indique si le dossier est complet.
async function streamAttestationAdhesion(res, { adherent, adhesions, annee, dossier }) {
  const doc = new PDFDocument({ margin: 50 });
  const filename = `attestation-adhesion-${adherent.num_adherent}-${annee}.pdf`;

  drawHeader(doc, `Attestation d'adhésion — ${annee}`);
  drawRow(doc, "Adhérent :", `${adherent.civilite} ${adherent.nom} ${adherent.prenom}`);
  drawRow(doc, "N° adhérent :", adherent.num_adherent);
  drawRow(
    doc,
    "Statut du dossier :",
    dossier?.valid
      ? "Complet (à jour pour Club, FFESM, Assurance RC)"
      : `Incomplet (manquant : ${(dossier?.missing || []).join(", ") || "-"})`,
  );
  doc.moveDown(1);

  doc.fontSize(13).fillColor("#1a202c").text("Détail des adhésions", { underline: true });
  doc.moveDown(0.5);

  adhesions.forEach((a) => {
    const periode = `du ${new Date(a.date_debut).toLocaleDateString("fr-FR")} au ${new Date(
      a.date_fin,
    ).toLocaleDateString("fr-FR")}`;
    // Seule l'adhésion Club a un tarif suivi ; les autres types n'affichent
    // que leur période de validité.
    const detail =
      a.type === "Club" ? ` — ${a.statut_paiement} (${a.montant_paye}/${a.montant} €)` : "";
    doc
      .fontSize(11)
      .fillColor("#1a202c")
      .text(`${a.type} — ${periode}${detail}`);
  });

  doc.moveDown(2);
  doc
    .fontSize(10)
    .fillColor("#a0aec0")
    .text(`Document généré le ${new Date().toLocaleDateString("fr-FR")}.`);

  await sendPdfAsJson(res, doc, filename);
}

// Reçu de paiement générique — couvre adhésion / sortie / formation / caution.
async function streamRecuPaiement(res, { paiement, adherent, libelleReference }) {
  const doc = new PDFDocument({ margin: 50 });
  const filename = `recu-paiement-${paiement.id_paiement}.pdf`;

  drawHeader(doc, `Reçu de paiement n°${paiement.id_paiement}`);
  drawRow(doc, "Adhérent :", `${adherent.civilite} ${adherent.nom} ${adherent.prenom}`);
  drawRow(doc, "Date :", new Date(paiement.date_paiement).toLocaleDateString("fr-FR"));
  drawRow(doc, "Type de paiement :", paiement.type_paiement);
  drawRow(doc, "Référence :", libelleReference || "-");
  drawRow(doc, "Mode :", paiement.mode);
  drawRow(doc, "Montant :", `${paiement.montant} €`);
  drawRow(doc, "Statut :", paiement.statut);
  if (paiement.description) {
    doc.moveDown(0.5);
    drawRow(doc, "Description :", paiement.description);
  }

  doc.moveDown(2);
  doc
    .fontSize(10)
    .fillColor("#a0aec0")
    .text(`Document généré le ${new Date().toLocaleDateString("fr-FR")}.`);

  await sendPdfAsJson(res, doc, filename);
}

module.exports = {
  streamAttestationAdhesion,
  streamRecuPaiement,
};
