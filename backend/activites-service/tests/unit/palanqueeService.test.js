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
  // findOne/create utilisés par creerPlongeeBrouillon, appelé depuis
  // addMembre (voir la régression "recale id_palanquee..." plus bas).
  Plongee: { findOne: jest.fn(), create: jest.fn() },
  Sortie: { findByPk: jest.fn() },
}));
jest.mock("../../src/utils/serviceClients/identiteClient");
jest.mock("../../src/utils/internalAuth", () => ({
  getSystemAuthHeader: () => "Bearer test-system-token",
}));

const PalanqueeService = require("../../src/services/PalanqueeService");
const { Composer, Plongee } = require("../../src/models");
const identiteClient = require("../../src/utils/serviceClients/identiteClient");

const service = new PalanqueeService();
const user = { role: "president" };

describe("PalanqueeService.addMembre — ratio calculé sur niveau_au_moment", () => {
  beforeEach(() => {
    Composer.create.mockClear();
    Plongee.findOne.mockReset();
    Plongee.create.mockClear();
    identiteClient.getAdherentById.mockReset();
  });

  test("refuse un 5e membre si le groupe était réellement en ratio 1/4 à l'ajout, même si tous ont depuis progressé", async () => {
    jest.spyOn(service.palanqueeRepository, "findByIdDetailed").mockResolvedValue({
      id_palanquee: 1,
      id_sortie: 100,
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
    expect(Plongee.create).not.toHaveBeenCalled();
  });

  test("persiste niveau_au_moment (niveau réel de l'adhérent à l'ajout) sur la nouvelle ligne", async () => {
    jest.spyOn(service.palanqueeRepository, "findByIdDetailed").mockResolvedValue({
      id_palanquee: 2,
      id_sortie: 200,
      statut: "Ouverte",
      composers: [],
    });
    identiteClient.getAdherentById.mockResolvedValue({ num_adherent: "ADH-9", niveau: "Niveau 3" });
    Plongee.findOne.mockResolvedValue(null);
    Plongee.create.mockResolvedValue({});

    await service.addMembre(2, "ADH-9", user, "Bearer x");

    expect(Composer.create).toHaveBeenCalledWith({
      id_palanquee: 2,
      num_adherent: "ADH-9",
      niveau_au_moment: "Niveau 3",
    });
  });

  // Régression : PlongeeList groupe les plongées par Plongee.id_palanquee,
  // pas par Composer — un membre ajouté à une palanquée après le pointage
  // initial (ex : arrivée tardive) restait rattaché, dans le listage de
  // plongée, à l'ancienne composition (ou n'apparaissait dans aucun groupe)
  // tant que Plongee.id_palanquee n'était pas recalé.
  test("rattache la plongée existante du membre (créée par un pointage antérieur) à cette palanquée", async () => {
    jest.spyOn(service.palanqueeRepository, "findByIdDetailed").mockResolvedValue({
      id_palanquee: 3,
      id_sortie: 300,
      statut: "Ouverte",
      composers: [],
    });
    identiteClient.getAdherentById.mockResolvedValue({ num_adherent: "ADH-7", niveau: "Niveau 2" });
    const plongeeExistante = { id_palanquee: null, id_moniteur_validateur: null, save: jest.fn() };
    Plongee.findOne.mockResolvedValue(plongeeExistante);

    await service.addMembre(3, "ADH-7", user, "Bearer x");

    expect(plongeeExistante.id_palanquee).toBe(3);
    expect(plongeeExistante.save).toHaveBeenCalled();
    expect(Plongee.create).not.toHaveBeenCalled();
  });

  test("ne recale pas id_palanquee si la plongée existante est déjà validée (historique figé)", async () => {
    jest.spyOn(service.palanqueeRepository, "findByIdDetailed").mockResolvedValue({
      id_palanquee: 4,
      id_sortie: 400,
      statut: "Ouverte",
      composers: [],
    });
    identiteClient.getAdherentById.mockResolvedValue({ num_adherent: "ADH-8", niveau: "Niveau 2" });
    const plongeeValidee = { id_palanquee: 99, id_moniteur_validateur: 5, save: jest.fn() };
    Plongee.findOne.mockResolvedValue(plongeeValidee);

    await service.addMembre(4, "ADH-8", user, "Bearer x");

    expect(plongeeValidee.id_palanquee).toBe(99);
    expect(plongeeValidee.save).not.toHaveBeenCalled();
  });
});

describe("PalanqueeService.removeMembre — détache la plongée du membre retiré", () => {
  beforeEach(() => {
    Plongee.findOne.mockReset();
    Composer.findOne = jest.fn();
  });

  // Même régression que ci-dessus, sens inverse : un membre retiré de la
  // palanquée (Composer.destroy) ne doit plus apparaître dans ce groupe côté
  // PlongeeList, qui lit Plongee.id_palanquee.
  test("met id_palanquee à null sur la plongée du membre retiré", async () => {
    const composition = { destroy: jest.fn() };
    jest.spyOn(service.palanqueeRepository, "findByIdDetailed").mockResolvedValue({
      id_palanquee: 5,
      id_sortie: 500,
      statut: "Ouverte",
      id_guide_palanquee: null,
      id_secouriste: null,
      save: jest.fn(),
    });
    Composer.findOne.mockResolvedValue(composition);
    const plongeeLiee = { id_palanquee: 5, id_moniteur_validateur: null, save: jest.fn() };
    Plongee.findOne.mockResolvedValue(plongeeLiee);

    await service.removeMembre(5, "ADH-3", user);

    expect(composition.destroy).toHaveBeenCalled();
    expect(plongeeLiee.id_palanquee).toBeNull();
    expect(plongeeLiee.save).toHaveBeenCalled();
  });

  test("ne touche pas une plongée déjà validée", async () => {
    const composition = { destroy: jest.fn() };
    jest.spyOn(service.palanqueeRepository, "findByIdDetailed").mockResolvedValue({
      id_palanquee: 6,
      id_sortie: 600,
      statut: "Ouverte",
      id_guide_palanquee: null,
      id_secouriste: null,
      save: jest.fn(),
    });
    Composer.findOne.mockResolvedValue(composition);
    const plongeeValidee = { id_palanquee: 6, id_moniteur_validateur: 1, save: jest.fn() };
    Plongee.findOne.mockResolvedValue(plongeeValidee);

    await service.removeMembre(6, "ADH-4", user);

    expect(plongeeValidee.id_palanquee).toBe(6);
    expect(plongeeValidee.save).not.toHaveBeenCalled();
  });
});

// Régression : GET /palanquees (getAll -> findAllDetailed + enrichComposers)
// devenait inutilisable en pratique dès qu'un club avait un peu d'historique
// — chaque palanquée entraîne un appel HTTP identite-service par adhérent
// distinct de ses composers, sans déduplication entre palanquées (seulement
// au sein d'une même palanquée), et rien ne limite le nombre de lignes
// renvoyées. Utilisé sans le savoir par PlongeeList.jsx (regroupement "par
// sortie/par palanquée") sur un jeu de données réel (750 palanquées), ça
// prenait plus de 50s et bloquait le chargement de la page (voir aussi les
// autres requêtes de la page, mises en attente derrière par la limite de 6
// connexions simultanées par origine du navigateur). getAllLight (et sa
// route /palanquees/light) renvoie les mêmes lignes sans composers ni
// enrichissement : tout ce dont PlongeeList a besoin pour afficher un nom de
// palanquée par groupe.
describe("PalanqueeService.getAllLight", () => {
  test("délègue à findAllLight, sans passer par enrichComposers", async () => {
    const rows = [{ id_palanquee: 1, id_sortie: 10, nom_palanquee: "Palanquée A", statut: "Ouverte" }];
    jest.spyOn(service.palanqueeRepository, "findAllLight").mockResolvedValue(rows);
    const enrichSpy = jest.spyOn(service, "enrichComposers");

    const result = await service.getAllLight();

    expect(result).toBe(rows);
    expect(enrichSpy).not.toHaveBeenCalled();
  });
});
