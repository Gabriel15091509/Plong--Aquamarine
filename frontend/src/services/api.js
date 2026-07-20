import axios from "axios";

// URL relative : résolue par le navigateur contre l'origine de la page qui a
// chargé le frontend. En local, le serveur Vite (vite.config.js) proxifie
// "/api" vers le gateway-service local ; sur le cluster, l'ingress sert le
// frontend et l'API sous le même host, donc "/api" les atteint directement.
// Un host codé en dur devait être permuté manuellement à chaque fois.
const API_BASE_URL = "/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// Ajouter pour les notifications en temps réel
let socket = null;

export const connectWebSocket = () => {
  if (socket) return socket;

  const token = localStorage.getItem("token");
  if (!token) return null;

  socket = new WebSocket(`ws://${window.location.host}?token=${token}`);

  socket.onopen = () => {
    console.log("WebSocket connected");
  };

  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
  };

  socket.onclose = () => {
    console.log("WebSocket disconnected");
  };

  return socket;
};

export const disconnectWebSocket = () => {
  if (socket) {
    socket.close();
    socket = null;
  }
};

// Intercepteur pour ajouter le token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Intercepteur pour gérer les erreurs 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default api;
