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
