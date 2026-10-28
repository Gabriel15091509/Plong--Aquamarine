
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import 'leaflet/dist/leaflet.css'
import './styles/index.css'
import './utils/leafletIconFix'
import { ThemeProvider } from './context/ThemeContext'

// Le service worker (mise en cache/rejeu applicatif) a été retiré du build —
// voir vite.config.js. Un poste ayant déjà installé l'ancienne version doit
// être nettoyé immédiatement plutôt que d'attendre que le navigateur
// remarque, lors d'un futur contrôle de mise à jour, que sw.js a disparu
// (404) : en pratique ce délai peut être long, et jusque-là l'ancien service
// worker continuerait à intercepter les requêtes normalement. Ordre
// important : désinstaller le worker avant de vider les caches, sinon un
// évènement 'fetch' encore en vol pourrait recréer une entrée juste après
// sa suppression.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.unregister());
  });
}
if ('caches' in window) {
  caches.keys().then((names) => names.forEach((name) => caches.delete(name)));
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)
