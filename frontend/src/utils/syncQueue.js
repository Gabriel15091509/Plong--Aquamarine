// Pont avec la file d'attente d'écriture du service worker (src/sw.js,
// BackgroundSync). Permet à l'UI d'afficher combien d'actions sont en
// attente d'envoi, de quoi il s'agit, et d'être notifiée quand elles sont
// rejouées.

const RESOURCE_LABELS = {
  adherents: "Adhérent",
  adhesions: "Adhésion",
  sorties: "Sortie",
  inscriptions: "Inscription",
  plongees: "Plongée",
  materiels: "Matériel",
  formations: "Formation",
  "specialites-formation": "Spécialité de formation",
  paiements: "Paiement",
  "certificats-medicaux": "Certificat médical",
  moniteurs: "Moniteur",
  presidents: "Président",
  tresoriers: "Trésorier",
  incidents: "Incident",
  attributions: "Attribution",
  reparations: "Réparation",
  users: "Utilisateur",
  alertes: "Alerte",
  echeanciers: "Échéancier",
};

const METHOD_LABELS = {
  POST: "Création",
  PUT: "Modification",
  PATCH: "Modification",
  DELETE: "Suppression",
};

// "/api/adhesions/12" -> "Modification · Adhésion"
export function describePendingItem({ method, url }) {
  const path = new URL(url, window.location.origin).pathname;
  const segments = path.split("/").filter(Boolean); // ["api", "adhesions", "12"]
  const resourceSegment = segments[1];
  const label = RESOURCE_LABELS[resourceSegment] || resourceSegment || "Action";
  const action = METHOD_LABELS[method] || method;
  return `${action} · ${label}`;
}

export function formatElapsed(timestamp) {
  const minutes = Math.max(0, Math.round((Date.now() - timestamp) / 60000));
  if (minutes < 1) return "à l'instant";
  if (minutes === 1) return "il y a 1 min";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.round(minutes / 60);
  return hours === 1 ? "il y a 1 h" : `il y a ${hours} h`;
}

// Utilisé par le service worker pour ne montrer à chaque utilisateur que ses
// propres actions en attente (cf. sw.js, filtre sur metadata.user).
function getCurrentUserEmail() {
  try {
    return JSON.parse(localStorage.getItem("user"))?.email || null;
  } catch (error) {
    return null;
  }
}

export function getPendingSyncStatus() {
  return new Promise((resolve) => {
    if (!navigator.serviceWorker?.controller) {
      resolve({ size: 0, items: [] });
      return;
    }
    const channel = new MessageChannel();
    const timeout = setTimeout(() => resolve({ size: 0, items: [] }), 2000);
    channel.port1.onmessage = (event) => {
      clearTimeout(timeout);
      resolve({ size: event.data?.size ?? 0, items: event.data?.items ?? [] });
    };
    navigator.serviceWorker.controller.postMessage(
      { type: "GET_PENDING_SYNC_COUNT", user: getCurrentUserEmail() },
      [channel.port2],
    );
  });
}

export function onSyncQueueResult(callback) {
  if (!("serviceWorker" in navigator)) return () => {};
  const handler = (event) => {
    if (event.data?.type === "SYNC_QUEUE_RESULT") callback(event.data);
  };
  navigator.serviceWorker.addEventListener("message", handler);
  return () => navigator.serviceWorker.removeEventListener("message", handler);
}

// Force une tentative d'envoi immédiate plutôt que d'attendre le seul
// évènement 'sync' du navigateur (Background Sync : non supporté hors
// Chromium, et parfois retardé même quand supporté).
export function triggerSync() {
  navigator.serviceWorker?.controller?.postMessage({ type: "TRIGGER_SYNC" });
}

// Abandon volontaire d'une action en attente (bouton "supprimer" du badge).
export function deletePendingItem(id) {
  navigator.serviceWorker?.controller?.postMessage({ type: "DELETE_PENDING_ITEM", id });
}
