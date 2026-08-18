// Génération de CSV pour les exports comptables (CDC §8.3 : "le trésorier
// peut exporter les paiements mensuels"). Même contournement que utils/
// pdf.js (sendPdfAsJson) : un gestionnaire de téléchargement (IDM "Advanced
// Integration") intercepte toute réponse HTTP vue comme un fichier
// binaire/téléchargeable, quel que soit Content-Disposition — on renvoie
// donc le CSV encodé en base64 dans du JSON ; le frontend reconstruit le
// blob et déclenche l'enregistrement lui-même (voir frontend/src/utils/
// downloadFile.js).

// Échappe un champ CSV (RFC 4180) : entouré de guillemets s'il contient le
// séparateur, un guillemet ou un retour à la ligne, guillemets internes
// doublés.
function escapeCsvField(value) {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[";\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Séparateur `;` (pas `,`) : c'est ce qu'Excel FR attend par défaut, la
// virgule y étant déjà le séparateur décimal.
function buildCsv(headers, rows) {
  const lines = [headers.map(escapeCsvField).join(";")];
  for (const row of rows) {
    lines.push(row.map(escapeCsvField).join(";"));
  }
  // BOM UTF-8 : sans lui Excel (FR) affiche les accents comme du charabia.
  const BOM = String.fromCharCode(0xfeff);
  return BOM + lines.join("\r\n");
}

function sendCsvAsJson(res, { headers, rows, filename }) {
  const csv = buildCsv(headers, rows);
  const buffer = Buffer.from(csv, "utf-8");
  res.json({ success: true, filename, data: buffer.toString("base64") });
}

module.exports = { buildCsv, sendCsvAsJson };
