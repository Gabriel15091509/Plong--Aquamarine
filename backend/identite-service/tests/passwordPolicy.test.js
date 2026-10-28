const {
  getPasswordPolicyErrors,
  assertStrongPassword,
} = require("../src/utils/passwordPolicy");

describe("getPasswordPolicyErrors", () => {
  test("liste les 5 règles manquantes pour un mot de passe vide", () => {
    expect(getPasswordPolicyErrors("")).toEqual(["le mot de passe est requis"]);
  });

  test("signale chaque critère manquant individuellement", () => {
    expect(getPasswordPolicyErrors("abcdefgh")).toEqual([
      "une lettre majuscule",
      "un chiffre",
      "un caractère spécial",
    ]);
  });

  test("signale la longueur insuffisante même si les autres critères sont réunis", () => {
    expect(getPasswordPolicyErrors("Ab1!")).toEqual(["au moins 8 caractères"]);
  });

  test("aucune erreur pour un mot de passe conforme aux 5 critères", () => {
    expect(getPasswordPolicyErrors("Plongee2026!")).toEqual([]);
  });
});

describe("assertStrongPassword", () => {
  test("ne lève rien pour un mot de passe conforme", () => {
    expect(() => assertStrongPassword("Plongee2026!")).not.toThrow();
  });

  test("lève une erreur listant les critères manquants", () => {
    expect(() => assertStrongPassword("abcdefgh")).toThrow(
      "Le mot de passe doit contenir une lettre majuscule, un chiffre, un caractère spécial.",
    );
  });
});
