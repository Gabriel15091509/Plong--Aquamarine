import api from "../services/api";

// Télécharge un fichier depuis une route authentifiée (ex. PDF) et déclenche
// l'enregistrement navigateur via un lien temporaire.
//
// Le backend ne renvoie pas le PDF en binaire brut : un gestionnaire de
// téléchargement (ex. Internet Download Manager, "Advanced Integration")
// intercepte toute réponse HTTP reconnue comme un fichier binaire
// (Content-Type application/pdf) et la rejoue lui-même hors du contexte de
// la page (sans le token d'auth), ce qui fait échouer la requête ici même si
// IDM récupère quand même le fichier de son côté. Le backend encode donc le
// PDF en base64 dans une réponse JSON, invisible pour ce type
// d'interception ; on reconstruit le blob PDF ici, côté JS uniquement.
// Partagé par downloadFile (téléchargement direct) et fetchPdfBlobUrl
// (aperçu) : les deux repartent du même flux base64 -> Blob, seule la suite
// (déclencher un enregistrement vs afficher dans un <iframe>) diffère.
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

export async function downloadFile(url, filename) {
  const { blob, filename: serverFilename } = await fetchPdfBlob(url);
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = serverFilename || filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}

// Pour un aperçu (modal avec <iframe>) : on garde le blob URL vivant tant que
// l'aperçu est affiché, à charge de l'appelant de le révoquer à la fermeture
// (window.URL.revokeObjectURL) pour ne pas fuiter de mémoire.
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
