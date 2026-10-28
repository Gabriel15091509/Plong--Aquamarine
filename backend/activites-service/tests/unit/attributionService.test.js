const AttributionService = require("../../src/services/AttributionService");
const identiteClient = require("../../src/utils/serviceClients/identiteClient");

jest.mock("../../src/utils/serviceClients/identiteClient");
jest.mock("../../src/utils/serviceClients/materielClient");
jest.mock("../../src/utils/serviceClients/paiementClient");
jest.mock("../../src/utils/serviceClients/vieAssociativeClient");

const service = new AttributionService();

// Régression : getById était hérité tel quel de BaseService (aucune
// vérification), contrairement à getByAdherent — un adhérent pouvait donc
// consulter (numéro de caution compris) l'attribution de n'importe qui
// d'autre en changeant juste l'id dans l'URL /attributions/:id.
describe("AttributionService.getById", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  test("un adhérent peut consulter sa propre attribution", async () => {
    const attribution = { id_attribution: 1, num_adherent: "ADH-1" };
    jest.spyOn(service.attributionRepository, "findById").mockResolvedValue(attribution);
    identiteClient.getAdherentForUser.mockResolvedValue({ num_adherent: "ADH-1" });

    const result = await service.getById(1, { role: "adherent", id: 42 });

    expect(result).toBe(attribution);
  });

  test("un adhérent ne peut pas consulter l'attribution d'un autre adhérent", async () => {
    const attribution = { id_attribution: 1, num_adherent: "ADH-1" };
    jest.spyOn(service.attributionRepository, "findById").mockResolvedValue(attribution);
    identiteClient.getAdherentForUser.mockResolvedValue({ num_adherent: "ADH-2" });

    await expect(
      service.getById(1, { role: "adherent", id: 99 }),
    ).rejects.toThrow(/Accès refusé/);
  });

  test("le président/trésorier voit n'importe quelle attribution", async () => {
    const attribution = { id_attribution: 1, num_adherent: "ADH-1" };
    jest.spyOn(service.attributionRepository, "findById").mockResolvedValue(attribution);
    identiteClient.getAdherentForUser.mockResolvedValue(null);

    const result = await service.getById(1, { role: "president", id: 7 });

    expect(result).toBe(attribution);
    expect(identiteClient.getMoniteurByUserId).not.toHaveBeenCalled();
  });

  // Même scoping que getAll ci-dessous, mais pour l'accès direct par id :
  // sans ce garde-fou, getAdherentForUser ne résout rien pour un moniteur
  // (branche adhérent ignorée) et il consultait n'importe quelle attribution
  // par id, y compris sur une sortie confiée à un autre moniteur.
  test("un moniteur peut consulter une attribution d'une sortie qu'il encadre", async () => {
    const attribution = { id_attribution: 1, num_adherent: "ADH-1", id_sortie: 10 };
    jest.spyOn(service.attributionRepository, "findById").mockResolvedValue(attribution);
    identiteClient.getAdherentForUser.mockResolvedValue(null);
    identiteClient.getMoniteurByUserId.mockResolvedValue({ id_moniteur: 5 });
    jest.spyOn(service.sortieRepository, "findIdsByEncadrant").mockResolvedValue([10, 11]);

    const result = await service.getById(1, { role: "moniteur", id: 7 });

    expect(result).toBe(attribution);
  });

  test("un moniteur ne peut pas consulter une attribution d'une sortie qu'il n'encadre pas", async () => {
    const attribution = { id_attribution: 1, num_adherent: "ADH-1", id_sortie: 99 };
    jest.spyOn(service.attributionRepository, "findById").mockResolvedValue(attribution);
    identiteClient.getAdherentForUser.mockResolvedValue(null);
    identiteClient.getMoniteurByUserId.mockResolvedValue({ id_moniteur: 5 });
    jest.spyOn(service.sortieRepository, "findIdsByEncadrant").mockResolvedValue([10, 11]);

    await expect(
      service.getById(1, { role: "moniteur", id: 7 }),
    ).rejects.toThrow(/Accès refusé/);
  });

  test("un moniteur ne peut pas consulter une attribution sans sortie (prêt libre)", async () => {
    const attribution = { id_attribution: 1, num_adherent: "ADH-1", id_sortie: null };
    jest.spyOn(service.attributionRepository, "findById").mockResolvedValue(attribution);
    identiteClient.getAdherentForUser.mockResolvedValue(null);
    identiteClient.getMoniteurByUserId.mockResolvedValue({ id_moniteur: 5 });
    jest.spyOn(service.sortieRepository, "findIdsByEncadrant").mockResolvedValue([10, 11]);

    await expect(
      service.getById(1, { role: "moniteur", id: 7 }),
    ).rejects.toThrow(/Accès refusé/);
  });

  test("retourne null sans vérifier l'accès quand l'attribution n'existe pas", async () => {
    jest.spyOn(service.attributionRepository, "findById").mockResolvedValue(null);

    const result = await service.getById(999, { role: "adherent", id: 42 });

    expect(result).toBeNull();
    expect(identiteClient.getAdherentForUser).not.toHaveBeenCalled();
  });
});

// getAll scopé par rôle, même principe que InscriptionService/PlongeeService/
// PalanqueeService.getAll : un adhérent ne voit que ses propres attributions,
// un moniteur celles des sorties qu'il encadre, le staff restant garde tout.
describe("AttributionService.getAll", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  test("un adhérent ne voit que ses propres attributions", async () => {
    const mesAttributions = [{ id_attribution: 1, num_adherent: "ADH-1" }];
    identiteClient.getAdherentForUser.mockResolvedValue({ num_adherent: "ADH-1" });
    const findByAdherent = jest
      .spyOn(service.attributionRepository, "findByAdherent")
      .mockResolvedValue(mesAttributions);
    const findAll = jest.spyOn(service.attributionRepository, "findAll");

    const result = await service.getAll({ role: "adherent", id: 42 });

    expect(result).toBe(mesAttributions);
    expect(findByAdherent).toHaveBeenCalledWith("ADH-1");
    expect(findAll).not.toHaveBeenCalled();
  });

  test("un moniteur voit les attributions des sorties qu'il encadre", async () => {
    identiteClient.getAdherentForUser.mockResolvedValue(null);
    identiteClient.getMoniteurByUserId.mockResolvedValue({ id_moniteur: 5 });
    const findIdsByEncadrant = jest
      .spyOn(service.sortieRepository, "findIdsByEncadrant")
      .mockResolvedValue([10, 11]);
    const attributionsSorties = [{ id_attribution: 2, id_sortie: 10 }];
    const findBySorties = jest
      .spyOn(service.attributionRepository, "findBySorties")
      .mockResolvedValue(attributionsSorties);

    const result = await service.getAll({ role: "moniteur", id: 7 });

    expect(result).toBe(attributionsSorties);
    expect(findIdsByEncadrant).toHaveBeenCalledWith(5);
    expect(findBySorties).toHaveBeenCalledWith([10, 11]);
  });

  test("un moniteur sans fiche moniteur résolue ne voit aucune attribution", async () => {
    identiteClient.getAdherentForUser.mockResolvedValue(null);
    identiteClient.getMoniteurByUserId.mockResolvedValue(null);
    const findBySorties = jest.spyOn(service.attributionRepository, "findBySorties");

    const result = await service.getAll({ role: "moniteur", id: 7 });

    expect(result).toEqual([]);
    expect(findBySorties).not.toHaveBeenCalled();
  });

  test("le président/trésorier (rôle non résolu en adhérent) voit toutes les attributions", async () => {
    identiteClient.getAdherentForUser.mockResolvedValue(null);
    const toutes = [{ id_attribution: 1 }, { id_attribution: 2 }];
    const findAll = jest.spyOn(service.attributionRepository, "findAll").mockResolvedValue(toutes);

    const result = await service.getAll({ role: "president", id: 1 });

    expect(result).toBe(toutes);
    expect(findAll).toHaveBeenCalled();
    expect(identiteClient.getMoniteurByUserId).not.toHaveBeenCalled();
  });
});
