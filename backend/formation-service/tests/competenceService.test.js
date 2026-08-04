const CompetenceService = require("../src/services/CompetenceService");

const service = new CompetenceService();

describe("CompetenceService.validateCompetenceData", () => {
  test("accepte un jeu de données complet et valide", async () => {
    const errors = await service.validateCompetenceData({
      id_formation: 1,
      libelle: "Maîtrise de la flottabilité",
      niveau_requis: "N2",
    });
    expect(errors).toEqual([]);
  });

  test("signale chaque champ obligatoire manquant", async () => {
    const errors = await service.validateCompetenceData({});
    expect(errors).toHaveLength(3);
    expect(errors).toContain("La formation est requise");
    expect(errors).toContain("Le libellé est requis");
    expect(errors).toContain("Le niveau requis est requis");
  });
});
