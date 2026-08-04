const { defineConfig, devices } = require("@playwright/test");

// Test système / E2E : suppose la stack déjà lancée en local (`npm run
// dev:full` à la racine, ou les services + `npm run dev` dans frontend/,
// séparément) — contrairement aux tests unitaires/intégration, on ne
// démarre rien ici, cf. e2e/README.md.
module.exports = defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 0,
  // "list" pour le suivi en direct dans le terminal pendant la démo,
  // "html" pour le rapport interactif (captures d'écran, trace pas à pas)
  // à ouvrir ensuite pour le jury via `npx playwright show-report`.
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 30_000,
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
