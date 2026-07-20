import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
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
