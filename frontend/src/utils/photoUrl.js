const API_ORIGIN = "http://localhost:5000";

// Les photos (adhérent/moniteur/président/trésorier, toutes stockées sur le
// compte User partagé) sont servies par le backend en chemin relatif
// (/uploads/avatars/...) : il faut le préfixer par l'origine de l'API,
// sinon le navigateur les cherche sur l'origine du frontend (Vite).
export const photoUrl = (photo) => (photo ? `${API_ORIGIN}${photo}` : null);
