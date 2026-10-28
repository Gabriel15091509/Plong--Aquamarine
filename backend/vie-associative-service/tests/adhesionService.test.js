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

describe("AdhesionService.creerLicenceAutomatique", () => {
  afterEach(() => jest.restoreAllMocks());

  test("crée les 2 lignes FFESM et Assurance RC, En attente, sur l'année civile de l'obtention", async () => {
    jest.spyOn(service.adhesionRepository, "findOverlapping").mockResolvedValue(null);
    const createSpy = jest.spyOn(service.adhesionRepository, "create").mockImplementation((data) => data);

    const creees = await service.creerLicenceAutomatique("ADH-2026-0001", new Date("2026-03-15"));

    expect(creees).toHaveLength(2);
    expect(creees.map((a) => a.type)).toEqual(["FFESM", "Assurance RC"]);
    for (const adhesion of creees) {
      expect(adhesion.num_adherent).toBe("ADH-2026-0001");
      expect(adhesion.statut_validation).toBe("En attente");
      expect(adhesion.soumis_par_adherent).toBe(false);
      expect(adhesion.num_licence_ffesm).toBeNull();
      expect(adhesion.annee_adhesion).toBe(2026);
      expect(adhesion.date_debut).toEqual(new Date(2026, 0, 1));
      expect(adhesion.date_fin).toEqual(new Date(2026, 11, 31));
    }
    expect(createSpy).toHaveBeenCalledTimes(2);
  });

  test("n'écrase pas une ligne déjà existante pour la même période (idempotent)", async () => {
    jest.spyOn(service.adhesionRepository, "findOverlapping").mockResolvedValue({ id_adhesion: 42 });
    const createSpy = jest.spyOn(service.adhesionRepository, "create");

    const creees = await service.creerLicenceAutomatique("ADH-2026-0001", new Date("2026-03-15"));

    expect(creees).toHaveLength(0);
    expect(createSpy).not.toHaveBeenCalled();
  });
});

describe("AdhesionService.assertPreviousClubSoldee", () => {
  afterEach(() => jest.restoreAllMocks());

  test("ne fait rien si aucune adhésion Club impayée n'existe", async () => {
    const spy = jest
      .spyOn(service.adhesionRepository, "findUnpaidClub")
      .mockResolvedValue(null);
    await expect(
      service.assertPreviousClubSoldee("ADH-2026-0001"),
    ).resolves.toBeUndefined();
    expect(spy).toHaveBeenCalledWith("ADH-2026-0001");
  });

  test("lève une erreur si une adhésion Club précédente n'est pas réglée", async () => {
    jest.spyOn(service.adhesionRepository, "findUnpaidClub").mockResolvedValue({
      date_debut: "2025-01-01",
      date_fin: "2025-12-31",
      statut_paiement: "En attente",
    });
    await expect(
      service.assertPreviousClubSoldee("ADH-2026-0001"),
    ).rejects.toThrow(/n'est pas encore réglée/);
  });
});

describe("AdhesionService.create — Club bloqué tant qu'une Club précédente n'est pas soldée", () => {
  afterEach(() => jest.restoreAllMocks());

  const clubData = {
    num_adherent: "ADH-2026-0001",
    type: "Club",
    date_debut: "2026-01-01",
    date_fin: "2026-12-31",
    montant: 100,
    montant_paye: 100,
    annee_adhesion: 2026,
  };

  test("refuse une nouvelle adhésion Club tant qu'une précédente reste impayée", async () => {
    jest.spyOn(service.adhesionRepository, "findOverlapping").mockResolvedValue(null);
    jest.spyOn(service.adhesionRepository, "findUnpaidClub").mockResolvedValue({
      date_debut: "2025-01-01",
      date_fin: "2025-12-31",
      statut_paiement: "Partiel",
    });
    const createSpy = jest.spyOn(service.adhesionRepository, "create");

    await expect(service.create(clubData)).rejects.toThrow(/n'est pas encore réglée/);
    expect(createSpy).not.toHaveBeenCalled();
  });

  test("n'applique pas ce garde-fou aux types autres que Club (FFESM/Assurance)", async () => {
    const findUnpaidSpy = jest.spyOn(service.adhesionRepository, "findUnpaidClub");
    jest.spyOn(service.adhesionRepository, "findOverlapping").mockResolvedValue(null);
    jest.spyOn(service.adhesionRepository, "create").mockResolvedValue({ id_adhesion: 1 });

    await service.create({ ...clubData, type: "FFESM", montant: 0 });

    expect(findUnpaidSpy).not.toHaveBeenCalled();
  });
});

// Badge Sidebar : doit passer par le COUNT léger du repository, jamais par
// un findAll() côté service (voir AdhesionRepository.countEnAttenteValidation).
describe("AdhesionService.getEnAttenteValidationCount", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("délègue au COUNT léger du repository", async () => {
    jest.spyOn(service.adhesionRepository, "countEnAttenteValidation").mockResolvedValue(2);

    const result = await service.getEnAttenteValidationCount();

    expect(service.adhesionRepository.countEnAttenteValidation).toHaveBeenCalled();
    expect(result).toBe(2);
  });
});
