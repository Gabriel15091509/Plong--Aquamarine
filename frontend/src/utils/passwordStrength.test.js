import { describe, it, expect } from "vitest";
import { evaluatePasswordStrength, isPasswordStrong } from "./passwordStrength";

describe("evaluatePasswordStrength", () => {
  it("renvoie un score de 0 et aucun pourcentage pour un mot de passe vide", () => {
    const result = evaluatePasswordStrength("");
    expect(result.score).toBe(0);
    expect(result.percent).toBe(0);
  });

  it("compte chaque critère validé indépendamment", () => {
    const result = evaluatePasswordStrength("abcdefgh");
    expect(result.score).toBe(2); // longueur + minuscule seulement
    expect(result.criteria.find((c) => c.id === "length").passed).toBe(true);
    expect(result.criteria.find((c) => c.id === "uppercase").passed).toBe(false);
  });

  it("atteint le score maximal quand les 5 critères sont réunis", () => {
    const result = evaluatePasswordStrength("Plongee2026!");
    expect(result.score).toBe(5);
    expect(result.percent).toBe(100);
    expect(result.label).toBe("Très fort");
  });
});

describe("isPasswordStrong", () => {
  it("refuse un mot de passe auquel il manque un critère", () => {
    expect(isPasswordStrong("Plongee2026")).toBe(false); // pas de caractère spécial
  });

  it("accepte un mot de passe réunissant les 5 critères", () => {
    expect(isPasswordStrong("Plongee2026!")).toBe(true);
  });
});
