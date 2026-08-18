const PlongeeService = require("../../src/services/PlongeeService");
const materielClient = require("../../src/utils/serviceClients/materielClient");

jest.mock("../../src/utils/serviceClients/materielClient");

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
