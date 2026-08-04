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
        globIgnores: ["**/vendor/opencv.js"],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
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
    port: 3000,
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
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
