const AdhesionService = require("../src/services/AdhesionService");

const service = new AdhesionService();

const validData = {
  num_adherent: 1,
  type: "FFESSM",
  date_debut: "2026-01-01",
  date_fin: "2026-12-31",
  annee_adhesion: 2026,
};

describe("AdhesionService.validateAdhesionData", () => {
  test("accepte un jeu de données complet et valide", async () => {
    const errors = await service.validateAdhesionData(validData);
    expect(errors).toEqual([]);
  });

  test("signale chaque champ obligatoire manquant", async () => {
    const errors = await service.validateAdhesionData({});
    expect(errors).toHaveLength(5);
  });

  test("exige un montant positif pour le type Club", async () => {
    const errors = await service.validateAdhesionData({ ...validData, type: "Club", montant: 0 });
    expect(errors).toContain("Le montant doit être supérieur à 0");
  });

  test("rejette une date de fin antérieure ou égale à la date de début", async () => {
    const errors = await service.validateAdhesionData({
      ...validData,
      date_debut: "2026-12-31",
      date_fin: "2026-01-01",
    });
    expect(errors).toContain("La date de fin doit être postérieure à la date de début");
  });
});

describe("AdhesionService.assertLicenceUniquePerPersonne", () => {
  test("ne fait rien si aucun numéro de licence n'est fourni", async () => {
    const spy = jest.spyOn(service.adhesionRepository, "findOtherAdherentWithLicence");
    await expect(
      service.assertLicenceUniquePerPersonne("ADH-2026-0001", null),
    ).resolves.toBeUndefined();
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  test("lève une erreur si un autre adhérent porte déjà ce numéro de licence", async () => {
    const spy = jest
      .spyOn(service.adhesionRepository, "findOtherAdherentWithLicence")
      .mockResolvedValue({ num_adherent: "ADH-2026-0002" });
    await expect(
      service.assertLicenceUniquePerPersonne("ADH-2026-0001", "FF12345"),
    ).rejects.toThrow(/ADH-2026-0002/);
    spy.mockRestore();
  });

  test("ne lève rien si aucun autre adhérent ne porte ce numéro de licence", async () => {
    const spy = jest
      .spyOn(service.adhesionRepository, "findOtherAdherentWithLicence")
      .mockResolvedValue(null);
    await expect(
      service.assertLicenceUniquePerPersonne("ADH-2026-0001", "FF12345"),
    ).resolves.toBeUndefined();
    spy.mockRestore();
  });
});
