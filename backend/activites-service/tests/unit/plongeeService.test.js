const PlongeeService = require("../../src/services/PlongeeService");
const materielClient = require("../../src/utils/serviceClients/materielClient");
const identiteClient = require("../../src/utils/serviceClients/identiteClient");

jest.mock("../../src/utils/serviceClients/materielClient");
jest.mock("../../src/utils/serviceClients/identiteClient");

const service = new PlongeeService();

describe("PlongeeService.assertPlongeeModifiable", () => {
  test("ne lève pas pour une plongée non validée", () => {
    expect(() =>
      service.assertPlongeeModifiable({ id_moniteur_validateur: null }),
    ).not.toThrow();
  });

  test("lève pour une plongée déjà validée par un moniteur", () => {
    expect(() =>
      service.assertPlongeeModifiable({ id_moniteur_validateur: 3 }),
    ).toThrow(/validée/);
  });
});

describe("PlongeeService.validatePlongee", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("refuse de valider un brouillon sans profondeur ni durée", async () => {
    jest.spyOn(service, "getById").mockResolvedValue({
      id_moniteur_validateur: null,
      profondeur_max: null,
      duree: null,
    });

    await expect(service.validatePlongee(1, 7)).rejects.toThrow(/complétée/);
    expect(identiteClient.incrementPlongeesCount).not.toHaveBeenCalled();
  });

  test("refuse si seule la durée manque encore", async () => {
    jest.spyOn(service, "getById").mockResolvedValue({
      id_moniteur_validateur: null,
      profondeur_max: 20,
      duree: null,
    });

    await expect(service.validatePlongee(1, 7)).rejects.toThrow(/complétée/);
  });

  test("valide une plongée complète et incrémente le compteur de l'adhérent", async () => {
    const plongee = {
      id_moniteur_validateur: null,
      profondeur_max: 18,
      duree: 45,
      num_adherent: "ADH-1",
      id_seance: null,
      save: jest.fn().mockResolvedValue(undefined),
    };
    jest.spyOn(service, "getById").mockResolvedValue(plongee);
    identiteClient.incrementPlongeesCount.mockResolvedValue({});

    const result = await service.validatePlongee(1, 7);

    expect(plongee.id_moniteur_validateur).toBe(7);
    expect(plongee.save).toHaveBeenCalled();
    expect(identiteClient.incrementPlongeesCount).toHaveBeenCalledWith("ADH-1", null);
    expect(result).toBe(plongee);
  });

  test("ne revalide pas (et ne re-vérifie pas les données) une plongée déjà validée", async () => {
    identiteClient.incrementPlongeesCount.mockClear();
    const plongee = { id_moniteur_validateur: 3, profondeur_max: null, duree: null };
    jest.spyOn(service, "getById").mockResolvedValue(plongee);

    const result = await service.validatePlongee(1, 7);

    expect(result).toBe(plongee);
    expect(identiteClient.incrementPlongeesCount).not.toHaveBeenCalled();
  });
});

describe("PlongeeService.attachMaterielUtilise", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("attache un tableau vide si la plongée n'a pas de sortie associée", async () => {
    const spy = jest
      .spyOn(service.attributionRepository, "findByAdherentAndSortie")
      .mockResolvedValue([]);

    const result = await service.attachMaterielUtilise({ num_adherent: "ADH-1", id_sortie: null });

    expect(result.materiel_utilise).toEqual([]);
  });

  test("résout le matériel attribué pour l'adhérent et la sortie de la plongée", async () => {
    jest
      .spyOn(service.attributionRepository, "findByAdherentAndSortie")
      .mockResolvedValue([{ num_inventaire: "BLC-001" }]);
    materielClient.getByNumInventaire.mockResolvedValue({
      categorie: "Bloc",
      marque: "Aqualung",
      modele: "12L",
    });

    const result = await service.attachMaterielUtilise({ num_adherent: "ADH-1", id_sortie: 5 });

    expect(service.attributionRepository.findByAdherentAndSortie).toHaveBeenCalledWith("ADH-1", 5);
    expect(result.materiel_utilise).toEqual([
      { num_inventaire: "BLC-001", categorie: "Bloc", marque: "Aqualung", modele: "12L" },
    ]);
  });

  test("laisse le matériel non résolu (best-effort) si materiel-service est injoignable", async () => {
    jest
      .spyOn(service.attributionRepository, "findByAdherentAndSortie")
      .mockResolvedValue([{ num_inventaire: "BLC-002" }]);
    materielClient.getByNumInventaire.mockRejectedValue(new Error("injoignable"));

    const result = await service.attachMaterielUtilise({ num_adherent: "ADH-1", id_sortie: 5 });

    expect(result.materiel_utilise).toEqual([
      { num_inventaire: "BLC-002", categorie: null, marque: null, modele: null },
    ]);
  });

  test("accepte un tableau de plongées et enrichit chacune", async () => {
    jest.spyOn(service.attributionRepository, "findByAdherentAndSortie").mockResolvedValue([]);

    const result = await service.attachMaterielUtilise([
      { num_adherent: "ADH-1", id_sortie: 5 },
      { num_adherent: "ADH-2", id_sortie: 6 },
    ]);

    expect(result).toHaveLength(2);
    expect(result[0].materiel_utilise).toEqual([]);
    expect(result[1].materiel_utilise).toEqual([]);
  });
});
