// Régression : le ratio encadrant/plongeur (RG5, computeMaxRatio) était
// recalculé à chaque lecture à partir du niveau ACTUEL des membres déjà
// affectés à une palanquée, jamais du niveau qu'ils avaient réellement au
// moment d'y être ajoutés (Composer n'avait pas de colonne dédiée). Un
// membre passé Niveau 1 -> Niveau 2 après avoir rejoint une palanquée
// faisait ainsi passer, a posteriori, tout le groupe d'une exigence 1/4 à
// 1/6 — faussant un audit sur une plongée déjà terminée. Corrigé en figeant
// niveau_au_moment sur Composer à la création de la ligne, préféré au
// niveau live pour le calcul du ratio.
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

describe("PalanqueeService.addMembre — ratio calculé sur niveau_au_moment", () => {
  beforeEach(() => {
    Composer.create.mockClear();
    identiteClient.getAdherentById.mockReset();
  });

  test("refuse un 5e membre si le groupe était réellement en ratio 1/4 à l'ajout, même si tous ont depuis progressé", async () => {
    jest.spyOn(service.palanqueeRepository, "findByIdDetailed").mockResolvedValue({
      id_palanquee: 1,
      statut: "Ouverte",
      composers: [
        { num_adherent: "ADH-1", niveau_au_moment: "Niveau 1" },
        { num_adherent: "ADH-2", niveau_au_moment: "Niveau 1" },
        { num_adherent: "ADH-3", niveau_au_moment: "Niveau 1" },
        { num_adherent: "ADH-4", niveau_au_moment: "Niveau 1" },
      ],
    });
    // Niveau ACTUEL (résolu depuis identite-service) : tous progressés
    // Niveau 2 depuis — si le calcul retombait sur ce niveau live, plus
    // aucun membre ne serait "limitant" et le ratio grimperait à 1/6,
    // laissant passer un 5e membre à tort.
    identiteClient.getAdherentById.mockImplementation((num) =>
      Promise.resolve({ num_adherent: num, niveau: "Niveau 2" }),
    );

    await expect(service.addMembre(1, "ADH-5", user, "Bearer x")).rejects.toThrow(
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
