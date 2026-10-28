import api from "../services/api";

// Récupère un PDF depuis une route authentifiée sous forme de Blob, pour
// aperçu (voir fetchPdfBlobUrl plus bas — PdfPreviewModal.jsx) ou export CSV
// (downloadCsv, tout en bas).
//
// Le backend ne renvoie pas le PDF en binaire brut : un gestionnaire de
// téléchargement (ex. Internet Download Manager, "Advanced Integration")
// intercepte toute réponse HTTP reconnue comme un fichier binaire
// (Content-Type application/pdf) et la rejoue lui-même hors du contexte de
// la page (sans le token d'auth), ce qui fait échouer la requête ici même si
// IDM récupère quand même le fichier de son côté. Le backend encode donc le
// PDF en base64 dans une réponse JSON, invisible pour ce type
// d'interception ; on reconstruit le blob PDF ici, côté JS uniquement.
async function fetchPdfBlob(url) {
  const response = await api.get(url);
  const { data: base64, filename: serverFilename } = response.data;
  const byteChars = window.atob(base64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  const blob = new Blob([new Uint8Array(byteNumbers)], { type: "application/pdf" });
  return { blob, filename: serverFilename };
}

// Seul flux PDF de toute l'app (voir PdfPreviewModal.jsx) : un téléchargement
// direct sans aperçu (l'ancien `downloadFile`, supprimé) sautait la
// vérification visuelle du document avant de l'enregistrer — l'aperçu garde
// le blob URL vivant tant qu'il est affiché, à charge de l'appelant de le
// révoquer à la fermeture (window.URL.revokeObjectURL) pour ne pas fuiter de
// mémoire ; son propre bouton "Télécharger" (voir PdfPreviewModal.jsx) couvre
// le cas où l'utilisateur veut malgré tout l'enregistrer.
export async function fetchPdfBlobUrl(url, filename) {
  const { blob, filename: serverFilename } = await fetchPdfBlob(url);
  const blobUrl = window.URL.createObjectURL(blob);
  return { blobUrl, filename: serverFilename || filename };
}

// Même contournement IDM que fetchPdfBlob (voir plus haut), pour les exports
// CSV (ex. paiements mensuels du trésorier) : le backend encode le fichier en
// base64 dans du JSON plutôt qu'en réponse binaire directe.
async function fetchCsvBlob(url) {
  const response = await api.get(url);
  const { data: base64, filename: serverFilename } = response.data;
  const byteChars = window.atob(base64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  const blob = new Blob([new Uint8Array(byteNumbers)], { type: "text/csv;charset=utf-8;" });
  return { blob, filename: serverFilename };
}

export async function downloadCsv(url, filename) {
  const { blob, filename: serverFilename } = await fetchCsvBlob(url);
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = serverFilename || filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}
