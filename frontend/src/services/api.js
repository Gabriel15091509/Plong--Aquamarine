import axios from "axios";

// URL relative : résolue par le navigateur contre l'origine de la page qui a
// chargé le frontend. En local, le serveur Vite (vite.config.js) proxifie
// "/api" vers le gateway-service local ; sur le cluster, l'ingress sert le
// frontend et l'API sous le même host, donc "/api" les atteint directement.
// Un host codé en dur devait être permuté manuellement à chaque fois.
const API_BASE_URL = "/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "X-Auth-Transport": "cookie",
  },
  timeout: 30000,
  // adapter: "fetch" a été retiré. Il avait été introduit pour un problème
  // de service worker (src/sw.js) qui n'existe plus du tout dans ce projet
  // (retiré, voir vite.config.js et main.jsx qui désinstalle même les
  // anciennes installations) — la justification n'a donc plus lieu d'être.
  // Gardé, cet adaptateur restait une source connue de comportements fragiles
  // avec l'annulation de requêtes (AbortController) : react-query annule
  // automatiquement les requêtes d'une page quittée en pleine navigation
  // (plusieurs requêtes simultanées côté "Mes plongées" : plongées,
  // adhérents, moniteurs, sorties, palanquées), ce qui correspond exactement
  // au symptôme observé (cliquer "Voir" depuis cette page laissait ensuite
  // TOUTE requête suivante, même vers une autre route, ne plus jamais
  // partir — cohérent avec une instance axios partagée mise dans un état
  // cassé par une requête annulée, plutôt qu'un bug isolé à une page).
  // L'adaptateur XHR par défaut n'a pas ce risque.
});

// Ajouter pour les notifications en temps réel
let socket = null;

export const connectWebSocket = () => {
  if (socket) return socket;

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  socket = new WebSocket(`${protocol}//${window.location.host}`);

  socket.onopen = () => {
    console.log("Notifications temps réel : connexion WebSocket établie.");
  };

  socket.onerror = (error) => {
    console.error("Notifications temps réel : erreur de connexion WebSocket.", error);
  };

  socket.onclose = () => {
    console.log("Notifications temps réel : connexion WebSocket fermée.");
  };

  return socket;
};

export const disconnectWebSocket = () => {
  if (socket) {
    socket.close();
    socket = null;
  }
};

// Only the CSRF proof is readable by JavaScript; the session stays HttpOnly.
let csrfToken = null;
let csrfRequest = null;
async function getCsrfToken() {
  if (csrfToken) return csrfToken;
  if (!csrfRequest) {
    csrfRequest = axios.get(`${API_BASE_URL}/auth/csrf`, {
      withCredentials: true,
      headers: { "X-Auth-Transport": "cookie" },
    }).then((response) => {
      csrfToken = response.data.data.csrfToken;
      return csrfToken;
    }).finally(() => { csrfRequest = null; });
  }
  return csrfRequest;
}

api.interceptors.request.use(
  async (config) => {
    if (["post", "put", "patch", "delete"].includes(config.method?.toLowerCase())) {
      config.headers["X-CSRF-Token"] = await getCsrfToken();
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Intercepteur pour gérer les erreurs 401
api.interceptors.response.use(
  (response) => {
    if (response.data?.data?.csrfToken) csrfToken = response.data.data.csrfToken;
    if (response.config?.url === "/auth/logout") {
      csrfToken = null;
      disconnectWebSocket();
    }
    return response;
  },
  async (error) => {
    // A second tab may have rotated the session. Retry only a CSRF rejection,
    // which is emitted before the controller performs any write.
    if (error.response?.status === 403 && error.response.data?.code === "CSRF_INVALID" && !error.config?._csrfRetried) {
      csrfToken = null;
      error.config._csrfRetried = true;
      return api.request(error.config);
    }
    // Un 401 sur /auth/login ou /auth/verify-otp est une réponse
    // normale du formulaire (email/mot de passe incorrect, code OTP
    // invalide), pas une session expirée — le traiter comme les autres
    // 401 videait le token (déjà absent à ce stade) et rechargeait la
    // page de connexion par-dessus elle-même, effaçant le toast
    // d'erreur avant que l'utilisateur ait pu le lire. Seul un 401 sur
    // une route déjà authentifiée doit purger la session.
    const isAuthAttempt = ["/auth/login", "/auth/verify-otp", "/auth/session"].some((path) =>
      error.config?.url?.startsWith(path),
    );
    if (error.response?.status === 401 && !isAuthAttempt) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }

    // Une écriture (POST/PUT/PATCH/DELETE) sans réponse HTTP a été mise en
    // file par le service worker (src/sw.js, Queue workbox-background-sync) :
    // elle sera rejouée automatiquement dès la reconnexion. On enrichit l'erreur
    // pour que les toasts existants (`error.response?.data?.message`, répétés
    // dans chaque hook) affichent ce message au lieu d'un "Erreur..." générique
    // trompeur, sans devoir toucher chaque hook individuellement.
    const isWrite = ["post", "put", "patch", "delete"].includes(
      error.config?.method,
    );
    if (isWrite && !error.response) {
      error.response = {
        data: {
          message:
            "Connexion impossible : l'action a été mise en attente et sera envoyée automatiquement dès le retour du réseau.",
        },
      };
      // Le badge (SyncQueueBadge.jsx) ne repolle le SW que toutes les 15s ou
      // au retour réseau — sans cet évènement, une action qui vient d'être
      // mise en file n'apparaîtrait pas tout de suite dans le compteur.
      window.dispatchEvent(new Event("sync-queue-changed"));
    }

    return Promise.reject(error);
  },
);

export default api;
