const AdherentService = require("../src/services/AdherentService");

const service = new AdherentService();

const validData = { nom: "Payet", prenom: "Marie", email: "marie.payet@gmail.com" };

describe("AdherentService.validateAdherentData", () => {
  test("accepte un jeu de données complet et valide", async () => {
    const errors = await service.validateAdherentData(validData);
    expect(errors).toEqual([]);
  });

  test("signale nom/prénom/email manquants", async () => {
    const errors = await service.validateAdherentData({});
    expect(errors).toHaveLength(3);
  });

  test("rejette un email malformé", async () => {
    const errors = await service.validateAdherentData({ ...validData, email: "pas-un-email" });
    expect(errors).toContain("Email invalide");
  });
});

describe("AdherentService.isValidEmail", () => {
  test("distingue un email valide d'un invalide", () => {
    expect(service.isValidEmail("jean.dupont@gmail.com")).toBe(true);
    expect(service.isValidEmail("jean.dupont@")).toBe(false);
    expect(service.isValidEmail("sans-arobase")).toBe(false);
  });
});
