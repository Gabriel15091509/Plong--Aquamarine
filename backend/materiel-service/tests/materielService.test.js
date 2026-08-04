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
