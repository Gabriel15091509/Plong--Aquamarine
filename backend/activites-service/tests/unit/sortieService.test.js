const SortieService = require("../../src/services/SortieService");

const service = new SortieService();

const validData = {
  type: "Plongée",
  lieu: "Saint-Leu",
  site: "La Corne",
  date_heure: "2026-09-01T08:00:00.000Z",
  nb_places: 8,
};

describe("SortieService.validateSortieData", () => {
  test("accepte un jeu de données complet et valide", async () => {
    const errors = await service.validateSortieData(validData);
    expect(errors).toEqual([]);
  });

  test("signale chaque champ obligatoire manquant", async () => {
    const errors = await service.validateSortieData({});
    const fields = errors.map((e) => e.field);
    expect(fields.sort()).toEqual(["date_heure", "lieu", "nb_places", "site", "type"]);
  });

  test("rejette un nombre de places nul ou négatif", async () => {
    const errors = await service.validateSortieData({ ...validData, nb_places: 0 });
    expect(errors.some((e) => e.field === "nb_places")).toBe(true);
  });

  test("exige latitude et longitude ensemble", async () => {
    const errors = await service.validateSortieData({ ...validData, latitude: -21.17 });
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe("latitude");
    expect(errors[0].message).toMatch(/ensemble/);
  });

  test("accepte une paire latitude/longitude valide", async () => {
    const errors = await service.validateSortieData({
      ...validData,
      latitude: -21.1706,
      longitude: 55.2894,
    });
    expect(errors).toEqual([]);
  });

  test("rejette une latitude hors plage [-90, 90]", async () => {
    const errors = await service.validateSortieData({
      ...validData,
      latitude: 120,
      longitude: 55.2894,
    });
    expect(errors.some((e) => e.field === "latitude" && /-90 et 90/.test(e.message))).toBe(true);
  });

  test("rejette une longitude hors plage [-180, 180]", async () => {
    const errors = await service.validateSortieData({
      ...validData,
      latitude: -21.17,
      longitude: 200,
    });
    expect(errors.some((e) => e.field === "longitude" && /-180 et 180/.test(e.message))).toBe(true);
  });
});

describe("SortieService.assertSortiePlanifiee", () => {
  test("ne lève pas pour une sortie Planifiée", () => {
    expect(() => service.assertSortiePlanifiee({ statut: "Planifiée" })).not.toThrow();
  });

  test("lève pour une sortie déjà Terminée", () => {
    expect(() => service.assertSortiePlanifiee({ statut: "Terminée" })).toThrow(/encore planifiée/);
  });
});

describe("SortieService.assertSortieModifiable", () => {
  test("ne lève pas pour une sortie Planifiée, quels que soient les champs modifiés", () => {
    expect(() =>
      service.assertSortieModifiable({ statut: "Planifiée" }, { lieu: "Autre lieu" }),
    ).not.toThrow();
  });

  test("ne lève pas pour une sortie En cours si seul le statut change", () => {
    expect(() =>
      service.assertSortieModifiable({ statut: "En cours" }, { statut: "Terminée" }),
    ).not.toThrow();
  });

  test("lève pour une sortie En cours dès qu'un autre champ change", () => {
    expect(() =>
      service.assertSortieModifiable({ statut: "En cours" }, { lieu: "Autre lieu" }),
    ).toThrow(/quitté le statut/);
  });

  test("lève pour une sortie Terminée même sans changement de statut demandé", () => {
    expect(() =>
      service.assertSortieModifiable({ statut: "Terminée" }, { tarif_adherent: 20 }),
    ).toThrow(/quitté le statut/);
  });
});
