import { precacheAndRoute, createHandlerBoundToURL } from "workbox-precaching";
import { registerRoute, NavigationRoute } from "workbox-routing";
import { NetworkFirst, NetworkOnly } from "workbox-strategies";
import { Queue } from "workbox-background-sync";
import { ExpirationPlugin } from "workbox-expiration";
import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { clientsClaim } from "workbox-core";

self.skipWaiting();
clientsClaim();

// App shell + assets buildés (injecté automatiquement par vite-plugin-pwa).
precacheAndRoute(self.__WB_MANIFEST);

// Navigation (ouverture/rechargement d'une route profonde comme /adherents,
// /sorties...) : sans cette route, seule "/" était servie hors-ligne depuis
// le precache — toute autre URL de la SPA tombait sur l'erreur réseau native
// du navigateur au lieu de l'app (confirmé : /adherents et /dashboard
// échouaient avec ERR_INTERNET_DISCONNECTED alors que "/" fonctionnait).
registerRoute(
  new NavigationRoute(createHandlerBoundToURL("index.html"), {
    denylist: [/^\/api\//],
  }),
);

// Lecture API : réseau en priorité, secours sur le dernier résultat mis en
// cache si hors-ligne (consultation adhérents/sorties/carnet sans réseau).
registerRoute(
  ({ url, request }) => url.pathname.startsWith("/api/") && request.method === "GET",
  new NetworkFirst({
    cacheName: "api-cache",
    networkTimeoutSeconds: 5,
    plugins: [
      // Sans ce plugin, Workbox mettrait aussi en cache les réponses
      // d'erreur (403/500) — resservies telles quelles une fois hors-ligne.
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 300, maxAgeSeconds: 24 * 60 * 60 }),
    ],
  }),
);

// Écriture API : si le réseau échoue (hors-ligne ou service inatteignable),
// la requête est mise en file (IndexedDB) et rejouée automatiquement dès que
// la connexion revient — satisfait la synchronisation différée demandée
// sans attendre un cycle quotidien.
//
// onSync personnalisé (plutôt que BackgroundSyncPlugin par défaut) : sans ça,
// rien ne remonte à l'utilisateur quand la file est rejouée — pas de moyen de
// savoir si une action a fini par partir, échoué, ou expiré silencieusement
// après maxRetentionTime. On notifie chaque client ouvert du résultat.
const writeQueue = new Queue("api-write-queue", {
  maxRetentionTime: 24 * 60,
  onSync: async ({ queue }) => {
    let success = 0;
    let failed = 0;
    let entry;
    while ((entry = await queue.shiftRequest())) {
      try {
        await fetch(entry.request.clone());
        success += 1;
      } catch (error) {
        await queue.unshiftRequest(entry);
        failed += 1;
        break;
      }
    }
    if (success > 0 || failed > 0) {
      const clientsList = await self.clients.matchAll({ type: "window" });
      for (const client of clientsList) {
        client.postMessage({ type: "SYNC_QUEUE_RESULT", success, failed });
      }
    }
  },
});

const writeQueuePlugin = {
  fetchDidFail: async ({ request }) => {
    await writeQueue.pushRequest({ request });
  },
};

for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
  registerRoute(
    ({ url }) => url.pathname.startsWith("/api/"),
    new NetworkOnly({ plugins: [writeQueuePlugin] }),
    method,
  );
}

// Un client (page ouverte) peut demander le détail des actions en attente
// (badge cliquable) — getAll() purge au passage les entrées expirées
// (maxRetentionTime dépassé), donc la liste reflète uniquement ce qui sera
// réellement rejoué. On renvoie method/url/timestamp : l'UI se charge de
// traduire ça en libellé lisible (voir utils/syncQueue.js côté frontend).
self.addEventListener("message", (event) => {
  if (event.data?.type !== "GET_PENDING_SYNC_COUNT") return;
  const port = event.ports[0];
  if (!port) return;
  event.waitUntil(
    writeQueue.getAll().then((entries) =>
      port.postMessage({
        type: "PENDING_SYNC_COUNT",
        size: entries.length,
        items: entries.map((e) => ({
          method: e.request.method,
          url: e.request.url,
          timestamp: e.timestamp,
        })),
      }),
    ),
  );
});
