import { describe, it, expect } from "vitest";
import { getPasswordInputType, getPasswordInputStyle } from "./passwordFieldType";

// supportsTextSecurityMasking dépend de CSS.supports, indisponible dans
// l'environnement de test (jsdom) — ces tests couvrent donc uniquement le
// repli "non supporté" (type="password" natif), le seul chemin réellement
// exercé ici. Le chemin "supporté" (type="text" + masquage CSS) est vérifié
// manuellement en navigateur réel (voir le correctif dans
// ChangePasswordPage.jsx/ResetPasswordPage.jsx).
describe("getPasswordInputType", () => {
  it("renvoie toujours 'text' quand le mot de passe est affiché en clair", () => {
    expect(getPasswordInputType(true)).toBe("text");
  });

  it("retombe sur 'password' natif quand masqué et -webkit-text-security indisponible", () => {
    expect(getPasswordInputType(false)).toBe("password");
  });
});

describe("getPasswordInputStyle", () => {
  it("ne pose aucun style quand le mot de passe est affiché en clair", () => {
    expect(getPasswordInputStyle(true)).toBeUndefined();
  });

  it("ne pose aucun style quand masqué et -webkit-text-security indisponible (repli natif)", () => {
    expect(getPasswordInputStyle(false)).toBeUndefined();
  });
});
