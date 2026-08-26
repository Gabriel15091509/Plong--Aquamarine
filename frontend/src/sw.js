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

// Jeux de données complets préchargés par utils/offlinePrefetch.js : cache
// séparé du cache générique ci-dessous, avec une expiration bien plus
// longue (7 jours au lieu de 24h) et non partagée avec les 300 entrées
// "accessoires" (détails ponctuels...) — sans ça, ces listes préchargées
// pouvaient être évincées ou expirer avant que l'utilisateur ne rouvre
// l'app, alors qu'elles sont justement censées couvrir la consultation
// hors-ligne des pages jamais visitées. Matché sur le chemin seul (pas sur
// l'absence de query string) : `userService.getAll()` envoie par exemple
// "/api/users?" (query string vide mais présente) quand aucun filtre n'est
// choisi, et une même liste appelée avec un filtre simple (ex.
// "/api/sorties?statut=Planifiée") mérite tout autant ce cache longue durée
// — chaque variante d'URL reste mise en cache séparément (comportement par
// défaut de Workbox), seule la politique d'expiration change. À garder
// synchronisée avec PREFETCH_ENTRIES dans utils/offlinePrefetch.js.
const OFFLINE_DATASET_PATHS = new Set([
  "/api/adherents",
  "/api/sorties",
  "/api/inscriptions",
  "/api/formations",
  "/api/materiels",
  "/api/plongees",
  "/api/adhesions",
  "/api/certificats-medicaux",
  "/api/competences",
  "/api/specialites-formation",
  "/api/palanquees",
  "/api/attributions",
  "/api/incidents",
  "/api/moniteurs",
  "/api/paiements",
  "/api/president",
  "/api/reparations",
  "/api/tresoriers",
  "/api/users",
  "/api/dashboard/trends",
  "/api/dashboard/indicateurs",
]);

registerRoute(
  ({ url, request }) => request.method === "GET" && OFFLINE_DATASET_PATHS.has(url.pathname),
  new NetworkFirst({
    cacheName: "api-offline-dataset",
    networkTimeoutSeconds: 5,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      // maxEntries plus généreux qu'avant (60 au lieu de 20) : sans le
      // filtre "sans query string", chaque variante filtrée d'une même
      // liste (ex. plusieurs pages visitées avec des filtres différents)
      // compte comme une entrée séparée.
      new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 7 * 24 * 60 * 60 }),
    ],
  }),
);

// Lecture API : réseau en priorité, secours sur le dernier résultat mis en
// cache si hors-ligne (consultation adhérents/sorties/carnet sans réseau).
// Ne couvre plus les URLs ci-dessus (interceptées par la route précédente,
// Workbox priorise la première route qui matche) : reste pour les détails,
// listes filtrées/paginées et tout le reste.
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
// Décode le JWT (sans vérifier la signature — usage d'affichage seulement,
// pas une décision de sécurité) pour associer chaque action mise en file à
// l'utilisateur qui l'a déclenchée : si plusieurs comptes partagent le même
// appareil, chacun ne doit voir que ses propres actions en attente.
function decodeJwtEmail(authHeader) {
  try {
    const token = (authHeader || "").replace(/^Bearer\s+/i, "");
    const payload = token.split(".")[1];
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return json.email || null;
  } catch (error) {
    return null;
  }
}

// Distingue deux types d'échec au rejeu : un échec réseau (fetch rejette,
// toujours hors-ligne) remet l'action en tête de file pour réessayer plus
// tard ; une réponse HTTP d'erreur (400/401/409...) est un échec définitif
// (réessayer indéfiniment ne changerait rien et bloquerait toute la file
// derrière) — on l'abandonne et on le signale. Avant ce correctif, fetch()
// qui ne rejette QUE sur une vraie panne réseau faisait traiter tout ce qui
// répondait, même en erreur HTTP, comme un envoi réussi.
async function replayQueue(queue) {
  let success = 0;
  let failed = 0;
  let entry;
  while ((entry = await queue.shiftRequest())) {
    try {
      const response = await fetch(entry.request.clone());
      if (response.ok || response.type === "opaque") {
        success += 1;
      } else {
        failed += 1;
      }
    } catch (error) {
      await queue.unshiftRequest(entry);
      break;
    }
  }
  if (success > 0 || failed > 0) {
    const clientsList = await self.clients.matchAll({ type: "window" });
    for (const client of clientsList) {
      client.postMessage({ type: "SYNC_QUEUE_RESULT", success, failed });
    }
  }
}

const writeQueue = new Queue("api-write-queue", {
  maxRetentionTime: 24 * 60,
  onSync: ({ queue }) => replayQueue(queue),
});

const writeQueuePlugin = {
  fetchDidFail: async ({ request }) => {
    const user = decodeJwtEmail(request.headers.get("Authorization"));
    await writeQueue.pushRequest({ request, metadata: { user } });
  },
};

for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
  registerRoute(
    ({ url }) => url.pathname.startsWith("/api/"),
    new NetworkOnly({ plugins: [writeQueuePlugin] }),
    method,
  );
}

// Accès direct à l'IndexedDB de workbox-background-sync (même DB/store que
// la classe Queue, cf. workbox-background-sync/src/lib/QueueDb.ts) : l'API
// publique de Queue (getAll/size) omet volontairement l'id de chaque entrée,
// or il en faut un pour permettre la suppression individuelle d'une action
// depuis l'UI. Mêmes opérations que Queue sur le même schéma, donc pas de
// risque de désync avec ses shiftRequest/unshiftRequest.
const BGSYNC_DB_NAME = "workbox-background-sync";
const BGSYNC_STORE = "requests";
const BGSYNC_QUEUE_NAME = "api-write-queue";
const MAX_RETENTION_MS = 24 * 60 * 60 * 1000;

function openBgSyncDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(BGSYNC_DB_NAME);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getRawQueueEntries() {
  const db = await openBgSyncDb();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(BGSYNC_STORE, "readonly");
      const req = tx.objectStore(BGSYNC_STORE).index("queueName").getAll(IDBKeyRange.only(BGSYNC_QUEUE_NAME));
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

async function deleteRawQueueEntry(id) {
  const db = await openBgSyncDb();
  try {
    await new Promise((resolve, reject) => {
      const tx = db.transaction(BGSYNC_STORE, "readwrite");
      tx.objectStore(BGSYNC_STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

async function listPendingEntries() {
  const raw = await getRawQueueEntries();
  const now = Date.now();
  const valid = [];
  for (const entry of raw) {
    if (now - entry.timestamp > MAX_RETENTION_MS) {
      await deleteRawQueueEntry(entry.id);
    } else {
      valid.push(entry);
    }
  }
  return valid;
}

// Un client (page ouverte) peut :
// - demander le détail des actions en attente (badge cliquable), filtré sur
//   l'utilisateur courant (une entrée sans utilisateur identifié reste
//   visible par défaut plutôt que de devenir invisible pour tout le monde) ;
// - déclencher une tentative d'envoi immédiate au lieu de dépendre uniquement
//   du seul évènement 'sync' du navigateur (Background Sync : non supporté
//   hors Chromium, et parfois retardé même quand supporté — c'est ce qui
//   faisait que des actions restaient en attente alors que l'utilisateur
//   était déjà revenu en ligne) ;
// - supprimer une action précise de la file (abandon volontaire).
self.addEventListener("message", (event) => {
  const { data } = event;
  if (!data?.type) return;

  if (data.type === "GET_PENDING_SYNC_COUNT") {
    const port = event.ports[0];
    if (!port) return;
    event.waitUntil(
      listPendingEntries().then((entries) => {
        const filtered = data.user
          ? entries.filter((e) => !e.metadata?.user || e.metadata.user === data.user)
          : entries;
        port.postMessage({
          type: "PENDING_SYNC_COUNT",
          size: filtered.length,
          items: filtered.map((e) => ({
            id: e.id,
            method: e.requestData.method,
            url: e.requestData.url,
            timestamp: e.timestamp,
          })),
        });
      }),
    );
    return;
  }

  if (data.type === "DELETE_PENDING_ITEM") {
    event.waitUntil(deleteRawQueueEntry(data.id));
    return;
  }

  if (data.type === "TRIGGER_SYNC") {
    event.waitUntil(replayQueue(writeQueue));
  }
});
