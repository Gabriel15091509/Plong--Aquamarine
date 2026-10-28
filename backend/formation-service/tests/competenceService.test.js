jest.mock("../src/utils/serviceClients/identiteClient");

const CompetenceService = require("../src/services/CompetenceService");
const FormationRepository = require("../src/repositories/FormationRepository");
const identiteClient = require("../src/utils/serviceClients/identiteClient");

const service = new CompetenceService();

describe("CompetenceService.validateCompetenceData", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("accepte un jeu de données complet et valide", async () => {
    jest.spyOn(FormationRepository.prototype, "findById").mockResolvedValue(null);
    const errors = await service.validateCompetenceData({
      id_formation: 1,
      libelle: "Maîtrise de la flottabilité",
      niveau_requis: "N2",
    });
    expect(errors).toEqual([]);
  });

  test("signale chaque champ obligatoire manquant", async () => {
    const errors = await service.validateCompetenceData({});
    expect(errors).toHaveLength(2);
    expect(errors).toContain("La formation est requise");
    expect(errors).toContain("Le libellé est requis");
  });

  // "Le niveau requis" n'est plus un champ demandé/validé : voir
  // CompetenceService.create ci-dessous, qui l'impose toujours depuis
  // Formation.niveau_vise, jamais depuis une saisie utilisateur.
  test("n'exige plus niveau_requis, même absent", async () => {
    jest.spyOn(FormationRepository.prototype, "findById").mockResolvedValue(null);
    const errors = await service.validateCompetenceData({
      id_formation: 1,
      libelle: "Maîtrise de la flottabilité",
    });
    expect(errors).toEqual([]);
  });
});

describe("CompetenceService.create", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("impose le niveau requis depuis Formation.niveau_vise, quoi que le client ait envoyé", async () => {
    jest.spyOn(FormationRepository.prototype, "findById").mockResolvedValue({
      id_formation: 1,
      niveau_vise: "N2",
    });
    const createSpy = jest
      .spyOn(service.competenceRepository, "create")
      .mockResolvedValue({});

    await service.create({
      id_formation: 1,
      libelle: "Palmage efficace",
      niveau_requis: "N4", // volontairement incohérent, doit être ignoré
    });

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({ niveau_requis: "N2" }),
    );
  });

  test("rejette une compétence rattachée à une formation introuvable", async () => {
    jest.spyOn(FormationRepository.prototype, "findById").mockResolvedValue(null);

    await expect(
      service.create({ id_formation: 999, libelle: "Palmage efficace" }),
    ).rejects.toThrow("Formation non trouvée");
  });
});

describe("CompetenceService.validateCompetenceData — seul le moniteur assigné peut créer une compétence", () => {
  const data = { id_formation: 1, libelle: "Palmage efficace", niveau_requis: "N1" };

  beforeEach(() => {
    jest.spyOn(FormationRepository.prototype, "findById").mockResolvedValue({
      id_formation: 1,
      id_moniteur: 10,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    identiteClient.getMoniteurByUserId.mockClear();
  });

  test("refuse un autre moniteur que celui assigné à la formation", async () => {
    identiteClient.getMoniteurByUserId.mockResolvedValue({ id_moniteur: 99 }); // != 10

    await expect(
      service.validateCompetenceData(data, { id: 5, role: "moniteur" }),
    ).rejects.toThrow("Seul le moniteur assigné à cette formation peut la modifier");
  });

  test("accepte le moniteur assigné à la formation", async () => {
    identiteClient.getMoniteurByUserId.mockResolvedValue({ id_moniteur: 10 });

    const errors = await service.validateCompetenceData(data, { id: 5, role: "moniteur" });

    expect(errors).toEqual([]);
  });

  test("laisse passer le président (aucune restriction de propriétaire)", async () => {
    const errors = await service.validateCompetenceData(data, { id: 1, role: "president" });

    expect(errors).toEqual([]);
    expect(identiteClient.getMoniteurByUserId).not.toHaveBeenCalled();
  });
});
