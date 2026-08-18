const AdherentService = require("../src/services/AdherentService");
const AdherentRepository = require("../src/repositories/AdherentRepository");
const { Adherent } = require("../src/models");

const service = new AdherentService();

const validData = { nom: "Payet", prenom: "Marie", email: "marie.payet@gmail.com" };

describe("AdherentService.validateAdherentData", () => {
  test("accepte un jeu de données complet et valide", async () => {
    const errors = await service.validateAdherentData(validData);
    expect(errors).toEqual([]);
  });

  test("signale nom/prénom/email manquants", async () => {
    const errors = await service.validateAdherentData({});
    expect(errors).toHaveLength(3);
  });

  test("rejette un email malformé", async () => {
    const errors = await service.validateAdherentData({ ...validData, email: "pas-un-email" });
    expect(errors).toContain("Email invalide");
  });
});

describe("AdherentService.isValidEmail", () => {
  test("distingue un email valide d'un invalide", () => {
    expect(service.isValidEmail("jean.dupont@gmail.com")).toBe(true);
    expect(service.isValidEmail("jean.dupont@")).toBe(false);
    expect(service.isValidEmail("sans-arobase")).toBe(false);
  });
});

describe("AdherentService.getAdherentStats", () => {
  test("exclut les invités (CDC 3.2.1) du décompte des adhérents actifs", async () => {
    const spy = jest.spyOn(service.repository, "count").mockResolvedValue(0);
    await service.getAdherentStats();
    expect(spy).toHaveBeenCalledWith({ statut: "Actif", est_invite: false });
    spy.mockRestore();
  });
});

describe("AdherentRepository.findBySegment", () => {
  test("exclut les invités de la communication ciblée (CDC 3.6.1)", async () => {
    const repository = new AdherentRepository();
    const spy = jest.spyOn(Adherent, "findAll").mockResolvedValue([]);

    await repository.findBySegment({});

    expect(spy).toHaveBeenCalledWith({ where: { statut: "Actif", est_invite: false } });
    spy.mockRestore();
  });
});
