// src/utils/photoUrl.js
import { API_URL } from '../api/client';

// Meme logique que frontend/src/utils/photoUrl.js : les photos sont servies
// par le backend en chemin relatif (/uploads/avatars/...), il faut donc les
// prefixer par l'origine de l'API (pas celle du bundle Expo). API_URL vaut
// deja soit l'IP LAN detectee, soit le tunnel ngrok/Expo, donc on derive
// l'origine directement de lui plutot que de coder une valeur en dur comme
// cote web (qui suppose localhost:5000).
const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

export const photoUrl = (photo) => (photo ? `${API_ORIGIN}${photo}` : null);
