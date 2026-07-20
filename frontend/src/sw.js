import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { NetworkFirst, NetworkOnly } from "workbox-strategies";
import { BackgroundSyncPlugin } from "workbox-background-sync";
import { ExpirationPlugin } from "workbox-expiration";
import { clientsClaim } from "workbox-core";

self.skipWaiting();
clientsClaim();

// App shell + assets buildés (injecté automatiquement par vite-plugin-pwa).
precacheAndRoute(self.__WB_MANIFEST);

// Lecture API : réseau en priorité, secours sur le dernier résultat mis en
// cache si hors-ligne (consultation adhérents/sorties/carnet sans réseau).
registerRoute(
  ({ url, request }) => url.pathname.startsWith("/api/") && request.method === "GET",
  new NetworkFirst({
    cacheName: "api-cache",
    networkTimeoutSeconds: 5,
    plugins: [
      new ExpirationPlugin({ maxEntries: 300, maxAgeSeconds: 24 * 60 * 60 }),
    ],
  }),
);

// Écriture API : si le réseau échoue (hors-ligne ou service inatteignable),
// la requête est mise en file (IndexedDB) et rejouée automatiquement dès que
// la connexion revient — satisfait la synchronisation différée demandée
// sans attendre un cycle quotidien.
const writeQueue = new BackgroundSyncPlugin("api-write-queue", {
  maxRetentionTime: 24 * 60,
});

for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
  registerRoute(
    ({ url }) => url.pathname.startsWith("/api/"),
    new NetworkOnly({ plugins: [writeQueue] }),
    method,
  );
}
