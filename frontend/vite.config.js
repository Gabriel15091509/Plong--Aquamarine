import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import mkcert from "vite-plugin-mkcert";
import path from "path";
import { createRequire } from "node:module";
const securityPolicy = createRequire(import.meta.url)("../backend/shared/securityPolicy.js");

// Le service worker (Workbox, via vite-plugin-pwa) a été retiré : sa mise en
// cache HTTP (stratégie StaleWhileRevalidate) était pensée pour accélérer
// les rechargements, mais a fini par ajouter une couche de complexité et de
// comportements inattendus (voir src/main.jsx pour le nettoyage côté client
// des installations existantes). Le site fonctionne désormais en ligne
// classique, sans aucune couche de cache/rejeu applicative entre le
// navigateur et l'API.
export default defineConfig(({ command, isPreview, mode }) => ({
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.js",
    globals: true,
    css: false,
  },
  plugins: [
    react(),
    {
      name: "aquanature-csp",
      transformIndexHtml() {
        const development = command === "serve" && !isPreview;
        const content = securityPolicy.securityHeaders(development)["Content-Security-Policy"]
          .split("; ").filter((directive) => !directive.startsWith("frame-ancestors ")).join("; ");
        return [{ tag: "meta", attrs: { "http-equiv": "Content-Security-Policy", content }, injectTo: "head-prepend" }];
      },
    },
    // HTTPS en développement ; les tests et le preview CI restent indépendants
    // de l'installation des certificats locaux.
    command === "serve" && !isPreview && mode === "development" && mkcert(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    headers: securityPolicy.securityHeaders(true),
    https: command === "serve" && !isPreview && mode === "development",
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
    // The local build preview/CI must not inherit development's TLS flag.
    https: false,
    headers: securityPolicy.securityHeaders(false),
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
}));
