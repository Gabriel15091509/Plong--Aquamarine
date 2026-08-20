// Régression : le ratio encadrant/plongeur (computeMaxRatio) était
// recalculé à chaque lecture à partir du niveau ACTUEL des membres déjà
// affectés à une palanquée, jamais du niveau qu'ils avaient réellement au
// moment d'y être ajoutés (Composer n'avait pas de colonne dédiée). Un
// membre baptisé qui progresse ensuite faisait ainsi passer, a posteriori,
// tout le groupe d'un plafond de 1 (baptême, annexe III-16a) à 4 —
// faussant un audit sur une plongée déjà terminée. Corrigé en figeant
// niveau_au_moment sur Composer à la création de la ligne, préféré au
// niveau live pour le calcul du ratio.
//
// Voir aussi computeMaxRatio ci-dessous : le plafond "6" qui existait pour
// tout groupe sans baptême/N1 n'avait pas de base réglementaire réelle
// (Code du Sport, annexes III-16a/III-16b) — corrigé séparément (plafond
// uniforme à 4, sauf 1 pour un baptême).
jest.mock("../../src/models", () => ({
  Composer: { create: jest.fn() },
  Plongee: {},
  Sortie: {},
}));
jest.mock("../../src/utils/serviceClients/identiteClient");
jest.mock("../../src/utils/internalAuth", () => ({
  getSystemAuthHeader: () => "Bearer test-system-token",
}));

const PalanqueeService = require("../../src/services/PalanqueeService");
const { Composer } = require("../../src/models");
const identiteClient = require("../../src/utils/serviceClients/identiteClient");

const service = new PalanqueeService();
const user = { role: "president" };

describe("PalanqueeService.computeMaxRatio (Code du Sport, annexes III-16a/III-16b)", () => {
  test("un baptême dans le groupe plafonne à 1, quels que soient les autres niveaux", () => {
    expect(service.computeMaxRatio(["Baptême"])).toBe(1);
    expect(service.computeMaxRatio(["Baptême", "Niveau 4"])).toBe(1);
  });

  test("sans baptême, le plafond est 4 dans tous les cas — jamais 6, quel que soit le niveau", () => {
    expect(service.computeMaxRatio(["Niveau 1"])).toBe(4);
    expect(service.computeMaxRatio(["Niveau 2", "Niveau 3", "Niveau 4", "Moniteur"])).toBe(4);
    expect(service.computeMaxRatio([])).toBe(4);
  });
});

describe("PalanqueeService.addMembre — ratio calculé sur niveau_au_moment", () => {
  beforeEach(() => {
    Composer.create.mockClear();
    identiteClient.getAdherentById.mockReset();
  });

  test("refuse un 2e membre si le groupe était réellement un baptême à l'ajout, même si le membre a depuis progressé", async () => {
    jest.spyOn(service.palanqueeRepository, "findByIdDetailed").mockResolvedValue({
      id_palanquee: 1,
      statut: "Ouverte",
      composers: [{ num_adherent: "ADH-1", niveau_au_moment: "Baptême" }],
    });
    // Niveau ACTUEL (résolu depuis identite-service) : progressé Niveau 1
    // depuis — si le calcul retombait sur ce niveau live, le groupe ne
    // serait plus vu comme un baptême et le plafond remonterait à 4,
    // laissant passer un 2e membre à tort alors que ce baptême-là n'a
    // jamais eu droit qu'à 1 seul plongeur encadré.
    identiteClient.getAdherentById.mockResolvedValue({ num_adherent: "ADH-1", niveau: "Niveau 1" });

    await expect(service.addMembre(1, "ADH-2", user, "Bearer x")).rejects.toThrow(
      /Ratio encadrant\/plongeur dépassé/,
    );
    expect(Composer.create).not.toHaveBeenCalled();
  });

  test("refuse un 5e membre au-delà du plafond réglementaire de 4 (aucun palier à 6)", async () => {
    jest.spyOn(service.palanqueeRepository, "findByIdDetailed").mockResolvedValue({
      id_palanquee: 3,
      statut: "Ouverte",
      composers: [
        { num_adherent: "ADH-1", niveau_au_moment: "Niveau 3" },
        { num_adherent: "ADH-2", niveau_au_moment: "Niveau 3" },
        { num_adherent: "ADH-3", niveau_au_moment: "Niveau 4" },
        { num_adherent: "ADH-4", niveau_au_moment: "Niveau 4" },
      ],
    });
    identiteClient.getAdherentById.mockResolvedValue({ num_adherent: "ADH-5", niveau: "Niveau 3" });

    await expect(service.addMembre(3, "ADH-5", user, "Bearer x")).rejects.toThrow(
      /Ratio encadrant\/plongeur dépassé/,
    );
    expect(Composer.create).not.toHaveBeenCalled();
  });

  test("persiste niveau_au_moment (niveau réel de l'adhérent à l'ajout) sur la nouvelle ligne", async () => {
    jest.spyOn(service.palanqueeRepository, "findByIdDetailed").mockResolvedValue({
      id_palanquee: 2,
      statut: "Ouverte",
      composers: [],
    });
    identiteClient.getAdherentById.mockResolvedValue({ num_adherent: "ADH-9", niveau: "Niveau 3" });

    await service.addMembre(2, "ADH-9", user, "Bearer x");

    expect(Composer.create).toHaveBeenCalledWith({
      id_palanquee: 2,
      num_adherent: "ADH-9",
      niveau_au_moment: "Niveau 3",
    });
  });
});
