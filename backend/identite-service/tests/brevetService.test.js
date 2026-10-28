jest.mock("../src/utils/roleScope", () => ({
  ...jest.requireActual("../src/utils/roleScope"),
  getAdherentForUser: jest.fn(),
}));

const BrevetService = require("../src/services/BrevetService");
const { getAdherentForUser } = require("../src/utils/roleScope");

const service = new BrevetService();

describe("BrevetService.getAll — président/moniteur voient tout, un adhérent ne voit que le sien", () => {
  afterEach(() => jest.restoreAllMocks());

  test("un président (aucun adhérent lié au compte) reçoit l'historique complet, enrichi", async () => {
    getAdherentForUser.mockResolvedValue(null);
    const spy = jest.spyOn(service.brevetRepository, "findAllWithAdherent").mockResolvedValue([{ id_brevet: 1 }]);
    const spyOwn = jest.spyOn(service.brevetRepository, "findByAdherent");

    const result = await service.getAll({ id: 1, role: "president" });

    expect(result).toEqual([{ id_brevet: 1 }]);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spyOwn).not.toHaveBeenCalled();
  });

  test("un adhérent ne reçoit que ses propres brevets", async () => {
    getAdherentForUser.mockResolvedValue({ num_adherent: "ADH-2026-0001" });
    const spyAll = jest.spyOn(service.brevetRepository, "findAllWithAdherent");
    const spyOwn = jest.spyOn(service.brevetRepository, "findByAdherent").mockResolvedValue([{ id_brevet: 2 }]);

    const result = await service.getAll({ id: 5, role: "adherent" });

    expect(result).toEqual([{ id_brevet: 2 }]);
    expect(spyOwn).toHaveBeenCalledWith("ADH-2026-0001");
    expect(spyAll).not.toHaveBeenCalled();
  });
});

describe("BrevetService.getByAdherent — un adhérent ne peut consulter que ses propres brevets", () => {
  afterEach(() => jest.restoreAllMocks());

  test("refuse l'accès aux brevets d'un autre adhérent", async () => {
    getAdherentForUser.mockResolvedValue({ num_adherent: "ADH-2026-0001" });
    await expect(
      service.getByAdherent("ADH-2026-0002", { id: 5, role: "adherent" }),
    ).rejects.toThrow(/Accès refusé/);
  });

  test("autorise la consultation de ses propres brevets", async () => {
    getAdherentForUser.mockResolvedValue({ num_adherent: "ADH-2026-0001" });
    jest.spyOn(service.brevetRepository, "findByAdherent").mockResolvedValue([{ id_brevet: 3 }]);

    await expect(
      service.getByAdherent("ADH-2026-0001", { id: 5, role: "adherent" }),
    ).resolves.toEqual([{ id_brevet: 3 }]);
  });

  test("un président (pas d'adhérent lié) peut consulter les brevets de n'importe quel adhérent", async () => {
    getAdherentForUser.mockResolvedValue(null);
    jest.spyOn(service.brevetRepository, "findByAdherent").mockResolvedValue([{ id_brevet: 4 }]);

    await expect(
      service.getByAdherent("ADH-2026-0002", { id: 1, role: "president" }),
    ).resolves.toEqual([{ id_brevet: 4 }]);
  });
});
