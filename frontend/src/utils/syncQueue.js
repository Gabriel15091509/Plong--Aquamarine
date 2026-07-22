// Pont avec la file d'attente d'écriture du service worker (src/sw.js,
// BackgroundSync). Permet à l'UI d'afficher combien d'actions sont en
// attente d'envoi et d'être notifiée quand elles sont rejouées.

export function getPendingSyncCount() {
  return new Promise((resolve) => {
    if (!navigator.serviceWorker?.controller) {
      resolve(0);
      return;
    }
    const channel = new MessageChannel();
    const timeout = setTimeout(() => resolve(0), 2000);
    channel.port1.onmessage = (event) => {
      clearTimeout(timeout);
      resolve(event.data?.size ?? 0);
    };
    navigator.serviceWorker.controller.postMessage(
      { type: "GET_PENDING_SYNC_COUNT" },
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
