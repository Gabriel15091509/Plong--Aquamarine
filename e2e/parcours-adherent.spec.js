// Test système : parcours réel d'un adhérent à travers la stack complète
// (frontend Vite → gateway → identite-service pour le login, puis
// activites-service pour les sorties), navigateur headless, sans mock ni
// injection de token — seul un vrai login avec le compte de démo seedé
// (voir backend/identite-service/scripts/seedIdentite.js) valide que le
// gateway, le JWT et le routage frontend fonctionnent ensemble.
const { test, expect } = require("@playwright/test");

const ADHERENT_EMAIL = "adherent@plongee.com";
const ADHERENT_PASSWORD = "adherent123";

test("un adhérent se connecte, consulte le tableau de bord puis le détail d'une sortie", async ({ page }) => {
  await page.goto("/login");

  await page.locator('input[name="email"]').fill(ADHERENT_EMAIL);
  await page.locator('input[name="password"]').fill(ADHERENT_PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

  await page.getByRole("link", { name: "Sorties" }).click();
  await expect(page).toHaveURL(/\/sorties$/);

  const firstDetailLink = page.getByTitle("Voir").first();
  await expect(firstDetailLink).toBeVisible({ timeout: 10_000 });
  await firstDetailLink.click();

  await expect(page).toHaveURL(/\/sorties\/\d+$/);
  // La fiche affiche au moins le lieu/site de la sortie — preuve que les
  // données remontent réellement depuis activites-service via le gateway,
  // pas seulement que la route frontend se monte.
  await expect(page.getByText(/Informations générales|Localisation/i).first()).toBeVisible({
    timeout: 10_000,
  });
});

test("un accès direct à une page protégée sans session redirige vers /login", async ({ page }) => {
  await page.goto("/sorties");
  await expect(page).toHaveURL(/\/login/);
});
