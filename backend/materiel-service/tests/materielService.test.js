const MaterielService = require("../src/services/MaterielService");

const service = new MaterielService();

const validData = {
  num_inventaire: "INV-A0001",
  categorie: "Palme",
  marque: "Cressi",
  modele: "Gara",
  date_achat: "2024-01-10",
  localisation: "Local",
};

describe("MaterielService.validateMaterielData", () => {
  test("accepte un jeu de données complet et valide", async () => {
    const errors = await service.validateMaterielData(validData);
    expect(errors).toEqual([]);
  });

  test("signale chaque champ obligatoire manquant", async () => {
    const errors = await service.validateMaterielData({});
    expect(errors).toHaveLength(6);
  });

  test("exige la capacité pour un Bloc d'air", async () => {
    const errors = await service.validateMaterielData({ ...validData, categorie: "Bloc" });
    expect(errors.some((e) => /capacité/.test(e))).toBe(true);
  });

  test("exige l'état des sangles pour un Stabilisateur", async () => {
    const errors = await service.validateMaterielData({ ...validData, categorie: "Stabilisateur" });
    expect(errors.some((e) => /sangles/.test(e))).toBe(true);
  });

  test("exige l'état de la batterie pour un Ordinateur", async () => {
    const errors = await service.validateMaterielData({ ...validData, categorie: "Ordinateur" });
    expect(errors.some((e) => /batterie/.test(e))).toBe(true);
  });
});

describe("MaterielService.assertPasDeReparationActive", () => {
  afterEach(() => jest.restoreAllMocks());

  test("ne fait rien si aucune réparation active n'existe pour ce matériel", async () => {
    const spy = jest
      .spyOn(service.reparationRepository, "findActiveByMateriel")
      .mockResolvedValue(null);
    await expect(
      service.assertPasDeReparationActive("INV-A0001"),
    ).resolves.toBeUndefined();
    expect(spy).toHaveBeenCalledWith("INV-A0001");
  });

  test("lève une erreur si une réparation est en cours pour ce matériel", async () => {
    jest.spyOn(service.reparationRepository, "findActiveByMateriel").mockResolvedValue({
      date_constat: "2026-01-10",
      statut: "En cours",
    });
    await expect(
      service.assertPasDeReparationActive("INV-A0001"),
    ).rejects.toThrow(/réparation est en cours/);
  });
});

describe("MaterielService.update — verrouillé pendant une réparation active", () => {
  afterEach(() => jest.restoreAllMocks());

  test("refuse de repasser l'état à \"Bon\" tant qu'une réparation est en cours", async () => {
    jest.spyOn(service, "getById").mockResolvedValue({
      num_inventaire: "INV-A0001",
      etat: "À réparer",
      localisation: "En réparation",
    });
    jest
      .spyOn(service.reparationRepository, "findActiveByMateriel")
      .mockResolvedValue({ date_constat: "2026-01-10" });
    const updateSpy = jest.spyOn(service.materielRepository, "update");

    await expect(
      service.update("INV-A0001", { etat: "Bon" }),
    ).rejects.toThrow(/réparation est en cours/);
    expect(updateSpy).not.toHaveBeenCalled();
  });

  test("refuse de repasser la localisation à \"Local\" tant qu'une réparation est en cours", async () => {
    jest.spyOn(service, "getById").mockResolvedValue({
      num_inventaire: "INV-A0001",
      etat: "À réparer",
      localisation: "En réparation",
    });
    jest
      .spyOn(service.reparationRepository, "findActiveByMateriel")
      .mockResolvedValue({ date_constat: "2026-01-10" });

    await expect(
      service.update("INV-A0001", { localisation: "Local" }),
    ).rejects.toThrow(/réparation est en cours/);
  });

  test("laisse passer la modification d'un champ sans rapport, même si l'état stocké est déjà incohérent", async () => {
    // Ré-enregistrement complet d'une fiche déjà en base (formulaire
    // renvoyant systématiquement etat/localisation), sans changer ni l'un
    // ni l'autre : ne doit PAS redéclencher le garde-fou (même motif que le
    // correctif type/niveau_requis de SortieService.update).
    jest.spyOn(service, "getById").mockResolvedValue({
      num_inventaire: "INV-A0001",
      etat: "Bon",
      localisation: "Local",
    });
    const findActiveSpy = jest.spyOn(service.reparationRepository, "findActiveByMateriel");
    jest.spyOn(service.materielRepository, "update").mockResolvedValue({});

    await service.update("INV-A0001", { etat: "Bon", localisation: "Local", marque: "Mares" });

    expect(findActiveSpy).not.toHaveBeenCalled();
  });

  test("autorise le passage à \"Bon\" quand aucune réparation n'est en cours", async () => {
    jest.spyOn(service, "getById").mockResolvedValue({
      num_inventaire: "INV-A0001",
      etat: "À réparer",
      localisation: "Local",
    });
    jest.spyOn(service.reparationRepository, "findActiveByMateriel").mockResolvedValue(null);
    jest.spyOn(service.materielRepository, "update").mockResolvedValue({ etat: "Bon" });

    await expect(
      service.update("INV-A0001", { etat: "Bon" }),
    ).resolves.toEqual({ etat: "Bon" });
  });
});

describe("MaterielService.updateEtat / updateLocalisation — même garde-fou", () => {
  afterEach(() => jest.restoreAllMocks());

  test("updateEtat refuse \"Neuf\" tant qu'une réparation est en cours", async () => {
    jest.spyOn(service, "getById").mockResolvedValue({
      num_inventaire: "INV-A0001",
      etat: "À réparer",
      save: jest.fn(),
    });
    jest
      .spyOn(service.reparationRepository, "findActiveByMateriel")
      .mockResolvedValue({ date_constat: "2026-01-10" });

    await expect(service.updateEtat("INV-A0001", "Neuf")).rejects.toThrow(
      /réparation est en cours/,
    );
  });

  test("updateLocalisation refuse \"Local\" tant qu'une réparation est en cours", async () => {
    jest.spyOn(service, "getById").mockResolvedValue({
      num_inventaire: "INV-A0001",
      localisation: "En réparation",
      save: jest.fn(),
    });
    jest
      .spyOn(service.reparationRepository, "findActiveByMateriel")
      .mockResolvedValue({ date_constat: "2026-01-10" });

    await expect(service.updateLocalisation("INV-A0001", "Local")).rejects.toThrow(
      /réparation est en cours/,
    );
  });
});
