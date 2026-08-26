import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.js",
    globals: true,
    css: false,
  },
  plugins: [
    react(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.js",
      injectRegister: false,
      registerType: "autoUpdate",
      devOptions: { enabled: false },
      injectManifest: {
        // opencv.js (~13 Mo) est chargé à la demande via une balise <script>
        // (voir documentScanner.js) et ne doit jamais entrer dans le
        // précache du service worker ; le bundle principal dépasse
        // légèrement la limite par défaut (2 Mo) et a juste besoin d'un peu
        // de marge pour rester précaché.
        // pwa-192.png/pwa-512.png sont déjà injectées séparément par
        // vite-plugin-pwa (déclarées dans `manifest.icons` ci-dessous) : les
        // exclure ici évite une entrée en double dans le précache (même
        // fichier, même révision, ajouté deux fois pour rien).
        globIgnores: ["**/vendor/opencv.js", "**/pwa-192.png", "**/pwa-512.png"],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        // Par défaut, injectManifest ne précache que js/css/html : le logo
        // (src/assets/aqua.png, ~1,5 Mo, référencé par Logo.jsx) n'était donc
        // jamais mis en cache et disparaissait (icône cassée) une fois
        // hors-ligne, alors que tout le reste de l'app shell restait servi.
        globPatterns: ["**/*.{js,css,html,png,svg,ico}"],
      },
      manifest: {
        name: "Plongée Club",
        short_name: "Plongée Club",
        description: "Application de gestion de club de plongée",
        lang: "fr",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#0ea5e9",
        icons: [
          { src: "/pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-512.png", sizes: "512x512", type: "image/png" },
          { src: "/pwa-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    // host: true (= --host) : écoute sur 0.0.0.0 au lieu du seul localhost,
    // pour tester depuis un smartphone sur le même Wi-Fi sans repasser
    // `npm run dev -- --host` à chaque lancement (le `--host` seul, sans le
    // séparateur `--`, est avalé par npm et ignoré silencieusement).
    // strictPort : échoue si 3000 est déjà pris plutôt que de basculer sur
    // 3001 en silence — l'IP affichée resterait alors fausse par rapport à
    // ce que le téléphone doit composer.
    host: true,
    port: 3000,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      // Photos de profil / documents d'adhésion / certificats médicaux :
      // servis en dehors de "/api" par le gateway (voir
      // backend/gateway-service/src/app.js), qui relaie chaque sous-chemin
      // vers le microservice propriétaire (identite-service, vie-associative-
      // service). Sans ce proxy, Vite renvoie ses propres 404 sur ces chemins
      // relatifs en local.
      "/uploads": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
  // `vite preview` (bundle buildé, ex. smoke test E2E pré-déploiement) lit
  // sa PROPRE clé de config, pas `server.proxy` — sans celle-ci, tous les
  // appels /api de l'app tournée via `preview` retombent sur le port 3000
  // lui-même (404), le proxy ne s'appliquant qu'à `vite dev`.
  preview: {
    host: true,
    port: 3000,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
