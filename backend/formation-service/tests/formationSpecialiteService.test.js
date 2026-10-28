const FormationSpecialiteService = require("../src/services/FormationSpecialiteService");

const service = new FormationSpecialiteService();

function buildSpecialite(overrides = {}) {
  return {
    id_specialite_formation: 1,
    num_adherent: "ADH-2026-0001",
    id_moniteur: 1,
    type_specialite: "Nitrox",
    statut: "En cours",
    ...overrides,
  };
}

describe("FormationSpecialiteService.assertSpecialiteModifiable", () => {
  test("laisse passer une spécialité En cours", () => {
    expect(() =>
      service.assertSpecialiteModifiable(buildSpecialite({ statut: "En cours" })),
    ).not.toThrow();
  });

  test("bloque une spécialité déjà Terminée", () => {
    expect(() =>
      service.assertSpecialiteModifiable(buildSpecialite({ statut: "Terminée" })),
    ).toThrow("Cette spécialité est terminée : elle n'est plus modifiable.");
  });

  test("bloque une spécialité déjà Abandonnée", () => {
    expect(() =>
      service.assertSpecialiteModifiable(buildSpecialite({ statut: "Abandonnée" })),
    ).toThrow("Cette spécialité est abandonnée : elle n'est plus modifiable.");
  });
});

describe("FormationSpecialiteService.update", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("rejette toute modification d'une spécialité déjà Terminée", async () => {
    jest
      .spyOn(service.formationSpecialiteRepository, "findById")
      .mockResolvedValue(buildSpecialite({ statut: "Terminée" }));
    const updateSpy = jest.spyOn(service.formationSpecialiteRepository, "update");

    await expect(service.update(1, { commentaire: "Nouvelle note" })).rejects.toThrow(
      "Cette spécialité est terminée : elle n'est plus modifiable.",
    );
    expect(updateSpy).not.toHaveBeenCalled();
  });

  test("autorise la transition En cours -> Terminée elle-même (verrou basé sur l'état ACTUEL, pas demandé)", async () => {
    jest
      .spyOn(service.formationSpecialiteRepository, "findById")
      .mockResolvedValue(buildSpecialite({ statut: "En cours" }));
    const updateSpy = jest
      .spyOn(service.formationSpecialiteRepository, "update")
      .mockResolvedValue(buildSpecialite({ statut: "Terminée" }));

    await expect(service.update(1, { statut: "Terminée" })).resolves.toMatchObject({
      statut: "Terminée",
    });
    expect(updateSpy).toHaveBeenCalledWith(1, { statut: "Terminée" });
  });

  test("rejette une spécialité introuvable", async () => {
    jest.spyOn(service.formationSpecialiteRepository, "findById").mockResolvedValue(null);

    await expect(service.update(999, { commentaire: "x" })).rejects.toThrow(
      "Spécialité non trouvée",
    );
  });
});

describe("FormationSpecialiteService.delete", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("rejette la suppression d'une spécialité déjà Abandonnée", async () => {
    jest
      .spyOn(service.formationSpecialiteRepository, "findById")
      .mockResolvedValue(buildSpecialite({ statut: "Abandonnée" }));
    const deleteSpy = jest.spyOn(service.formationSpecialiteRepository, "delete");

    await expect(service.delete(1)).rejects.toThrow(
      "Cette spécialité est abandonnée : elle n'est plus modifiable.",
    );
    expect(deleteSpy).not.toHaveBeenCalled();
  });

  test("autorise la suppression d'une spécialité En cours", async () => {
    jest
      .spyOn(service.formationSpecialiteRepository, "findById")
      .mockResolvedValue(buildSpecialite({ statut: "En cours" }));
    const deleteSpy = jest
      .spyOn(service.formationSpecialiteRepository, "delete")
      .mockResolvedValue(true);

    await expect(service.delete(1)).resolves.toBe(true);
    expect(deleteSpy).toHaveBeenCalledWith(1);
  });
});
