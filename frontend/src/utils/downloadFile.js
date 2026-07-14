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
export async function downloadFile(url, filename) {
  const response = await api.get(url);
  const { data: base64, filename: serverFilename } = response.data;
  const byteChars = window.atob(base64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  const blob = new Blob([new Uint8Array(byteNumbers)], { type: "application/pdf" });
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = serverFilename || filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}
