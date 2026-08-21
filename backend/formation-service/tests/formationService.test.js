// checkPrerequis ne vérifiait qu'un plancher minimum (PREREQUIS_FORMATION
// .niveauMin) — rien ne garantissait que le niveau visé fasse réellement
// progresser l'adhérent. Un Niveau 3 pouvait être inscrit à une formation
// N1 (niveauMin: null, donc aucun plancher), ou un Niveau 2 réinscrit à une
// nouvelle formation N2 qu'il avait déjà. Corrigé en comparant niveau_vise
// (traduit via NIVEAU_OBTENU, ex. "N2" -> "Niveau 2") au niveau actuel de
// l'adhérent sur la même échelle (NIVEAU_ORDER), plutôt qu'une égalité de
// chaîne entre deux vocabulaires différents ("N2" !== "Niveau 2") qui
// aurait toujours échoué silencieusement.
jest.mock("../src/utils/serviceClients/identiteClient");
jest.mock("../src/utils/serviceClients/activitesClient");
jest.mock("../src/utils/serviceClients/vieAssociativeClient");

const FormationService = require("../src/services/FormationService");
const identiteClient = require("../src/utils/serviceClients/identiteClient");
const vieAssociativeClient = require("../src/utils/serviceClients/vieAssociativeClient");

const service = new FormationService();

describe("FormationService.checkPrerequis — niveau visé vs niveau actuel", () => {
  beforeEach(() => {
    vieAssociativeClient.checkDossierValidity.mockResolvedValue({ valid: true, missing: [] });
  });

  test("refuse une formation N1 pour un adhérent déjà Niveau 3 (aucun plancher ne le bloquait avant)", async () => {
    identiteClient.getAdherentById.mockResolvedValue({
      niveau: "Niveau 3",
      nb_plongees_total: 50,
      date_naissance: "1990-01-01",
    });

    const errors = await service.checkPrerequis("ADH-1", "N1", "Bearer x");

    expect(errors).toContain(
      "L'adhérent a déjà le niveau Niveau 3 : le niveau visé (Niveau 1) doit être strictement supérieur",
    );
  });

  test("refuse de réinscrire à une formation N2 un adhérent déjà Niveau 2", async () => {
    identiteClient.getAdherentById.mockResolvedValue({
      niveau: "Niveau 2",
      nb_plongees_total: 50,
      date_naissance: "1990-01-01",
    });

    const errors = await service.checkPrerequis("ADH-1", "N2", "Bearer x");

    expect(errors).toContain(
      "L'adhérent a déjà le niveau Niveau 2 : le niveau visé (Niveau 2) doit être strictement supérieur",
    );
  });

  test("accepte une formation N2 pour un adhérent Niveau 1 (progression normale)", async () => {
    identiteClient.getAdherentById.mockResolvedValue({
      niveau: "Niveau 1",
      nb_plongees_total: 20,
      date_naissance: "1990-01-01",
    });

    const errors = await service.checkPrerequis("ADH-1", "N2", "Bearer x");

    expect(errors).not.toEqual(
      expect.arrayContaining([expect.stringContaining("doit être strictement supérieur")]),
    );
  });

  test("n'applique pas ce contrôle à un adhérent sans niveau connu (jamais licencié)", async () => {
    identiteClient.getAdherentById.mockResolvedValue({
      niveau: null,
      nb_plongees_total: 6,
      date_naissance: "1990-01-01",
    });

    const errors = await service.checkPrerequis("ADH-1", "N1", "Bearer x");

    expect(errors).not.toEqual(
      expect.arrayContaining([expect.stringContaining("doit être strictement supérieur")]),
    );
  });
});
