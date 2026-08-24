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

  test("le staff (président/moniteur/trésorier) voit n'importe quelle attribution", async () => {
    const attribution = { id_attribution: 1, num_adherent: "ADH-1" };
    jest.spyOn(service.attributionRepository, "findById").mockResolvedValue(attribution);
    identiteClient.getAdherentForUser.mockResolvedValue(null);

    const result = await service.getById(1, { role: "president", id: 7 });

    expect(result).toBe(attribution);
  });

  test("retourne null sans vérifier l'accès quand l'attribution n'existe pas", async () => {
    jest.spyOn(service.attributionRepository, "findById").mockResolvedValue(null);

    const result = await service.getById(999, { role: "adherent", id: 42 });

    expect(result).toBeNull();
    expect(identiteClient.getAdherentForUser).not.toHaveBeenCalled();
  });
});
