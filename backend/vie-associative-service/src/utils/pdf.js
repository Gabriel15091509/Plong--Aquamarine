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

// Titre de section avec un petit accent de couleur, plus marqué qu'un simple
// soulignement.
function drawSectionTitle(doc, text) {
  const y = doc.y;
  doc.rect(50, y + 3, 4, 13).fill(BRAND.mid);
  doc.fillColor(INK).font("Helvetica-Bold").fontSize(13).text(text, 62, y);
  doc.font("Helvetica");
  doc.moveDown(0.6);
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

// Attestation d'adhésion : récapitule les lignes d'adhésion de l'adhérent
// pour l'année donnée et indique si le dossier est complet.
async function streamAttestationAdhesion(res, { adherent, adhesions, annee, dossier }) {
  const doc = new PDFDocument({ margin: 50 });
  const filename = `attestation-adhesion-${adherent.num_adherent}-${annee}.pdf`;

  drawHeader(
    doc,
    `Attestation d'adhésion — ${annee}`,
    `${adherent.civilite} ${adherent.nom} ${adherent.prenom} — N°${adherent.num_adherent}`,
  );

  const dossierColor = dossier?.valid ? "#059669" : "#dc2626";
  const dossierLabel = dossier?.valid
    ? "Complet (à jour pour Club, FFESM, Assurance RC)"
    : `Incomplet (manquant : ${(dossier?.missing || []).join(", ") || "-"})`;
  doc
    .fontSize(11)
    .fillColor(MUTED)
    .text("Statut du dossier :", { continued: true })
    .fillColor(dossierColor)
    .font("Helvetica-Bold")
    .text(`  ${dossierLabel}`)
    .font("Helvetica");
  doc.moveDown(1.2);

  drawSectionTitle(doc, "Détail des adhésions");

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
      .fillColor(INK)
      .text(`${a.type} — ${periode}${detail}`);
  });

  drawFooter(doc);

  await sendPdfAsJson(res, doc, filename);
}

module.exports = {
  streamAttestationAdhesion,
};
