const ReparationService = require("../src/services/ReparationService");
const { Materiel } = require("../src/models");

const service = new ReparationService();

const validData = {
  num_inventaire: "INV-A0001",
  date_constat: "2026-01-10",
  description_panne: "Fuite au niveau du premier étage",
  prestataire: "ProDive Réunion",
  cout: 80,
};

describe("ReparationService.validateReparationData", () => {
  test("accepte un jeu de données complet et valide", async () => {
    const errors = await service.validateReparationData(validData);
    expect(errors).toEqual([]);
  });

  test("signale chaque champ obligatoire manquant", async () => {
    const errors = await service.validateReparationData({});
    expect(errors).toHaveLength(5);
  });

  test("rejette un coût négatif", async () => {
    const errors = await service.validateReparationData({ ...validData, cout: -5 });
    expect(errors.some((e) => /coût/.test(e))).toBe(true);
  });
});

// create()/terminer() alignent etat ET localisation sur Materiel — un
// matériel envoyé à l'atelier ne peut pas rester "Bon"/"Neuf" (voir
// MaterielService.assertPasDeReparationActive, qui interdit ensuite de le
// repasser "Bon" tant que cette réparation n'est pas close).
describe("ReparationService.create — aligne etat ET localisation du matériel", () => {
  afterEach(() => jest.restoreAllMocks());

  test("passe le matériel en \"À réparer\" / \"En réparation\"", async () => {
    jest.spyOn(service.reparationRepository, "create").mockResolvedValue({
      id_reparation: 1,
      num_inventaire: "INV-A0001",
    });
    const updateSpy = jest.spyOn(Materiel, "update").mockResolvedValue([1]);

    await service.create(validData);

    expect(updateSpy).toHaveBeenCalledWith(
      { localisation: "En réparation", etat: "À réparer" },
      { where: { num_inventaire: "INV-A0001" } },
    );
  });

  test("n'échoue pas si la mise à jour du matériel échoue (best-effort)", async () => {
    jest.spyOn(service.reparationRepository, "create").mockResolvedValue({
      id_reparation: 1,
      num_inventaire: "INV-A0001",
    });
    jest.spyOn(Materiel, "update").mockRejectedValue(new Error("DB down"));
    jest.spyOn(console, "error").mockImplementation(() => {});

    await expect(service.create(validData)).resolves.toEqual({
      id_reparation: 1,
      num_inventaire: "INV-A0001",
    });
  });
});

describe("ReparationService.terminer — restaure etat ET localisation du matériel", () => {
  afterEach(() => jest.restoreAllMocks());

  test("repasse le matériel en \"Bon\" / \"Local\"", async () => {
    jest.spyOn(service.reparationRepository, "update").mockResolvedValue({
      id_reparation: 1,
      num_inventaire: "INV-A0001",
      statut: "Terminée",
    });
    const updateSpy = jest.spyOn(Materiel, "update").mockResolvedValue([1]);

    await service.terminer(1, "2026-02-01");

    expect(updateSpy).toHaveBeenCalledWith(
      { localisation: "Local", etat: "Bon" },
      { where: { num_inventaire: "INV-A0001" } },
    );
  });
});
