// Une séance "Pratique" liée à n'importe quelle sortie de type "Formation"
// pouvait être créée, même si son niveau requis dépassait ce que le
// stagiaire peut déjà avoir (niveau d'entrée de la formation visée), ou si
// la sortie n'était pas encadrée par le moniteur réellement en charge de la
// formation (Sortie.encadrants) — corrigé dans
// SeanceService.validateSeanceData (voir le commentaire associé).
jest.mock("../src/utils/serviceClients/activitesClient");
jest.mock("../src/utils/serviceClients/identiteClient");

const SeanceService = require("../src/services/SeanceService");
const FormationRepository = require("../src/repositories/FormationRepository");
const SeanceRepository = require("../src/repositories/SeanceRepository");
const activitesClient = require("../src/utils/serviceClients/activitesClient");
const identiteClient = require("../src/utils/serviceClients/identiteClient");

const service = new SeanceService();

const formationN2 = {
  id_formation: 1,
  id_moniteur: 10,
  niveau_vise: "N2", // PREREQUIS_FORMATION.N2.niveauMin === "Niveau 1"
};

const dataPratique = {
  id_formation: 1,
  date_seance: "2026-01-10",
  type_seance: "Pratique",
  id_sortie: 99,
};

describe("SeanceService.validateSeanceData — séance pratique liée à une sortie", () => {
  beforeEach(() => {
    jest.spyOn(FormationRepository.prototype, "findById").mockResolvedValue(formationN2);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("refuse une sortie dont le niveau requis dépasse le niveau d'entrée de la formation", async () => {
    activitesClient.getSortieById.mockResolvedValue({
      type: "Formation",
      niveau_requis: "Niveau 2", // stagiaire N2 n'a au mieux que "Niveau 1"
      encadrants: [10],
    });

    const errors = await service.validateSeanceData(dataPratique, "Bearer x");

    expect(errors).toContain(
      "Le niveau requis par la sortie (Niveau 2) n'est pas cohérent avec le niveau d'entrée de cette formation (Niveau 1)",
    );
  });

  test("accepte une sortie dont le niveau requis correspond au niveau d'entrée", async () => {
    activitesClient.getSortieById.mockResolvedValue({
      type: "Formation",
      niveau_requis: "Niveau 1",
      encadrants: [10],
    });

    const errors = await service.validateSeanceData(dataPratique, "Bearer x");

    expect(errors).toEqual([]);
  });

  test("refuse une sortie non encadrée par le moniteur en charge de la formation", async () => {
    activitesClient.getSortieById.mockResolvedValue({
      type: "Formation",
      niveau_requis: "Niveau 1",
      encadrants: [42], // pas le moniteur (id 10) de formationN2
    });

    const errors = await service.validateSeanceData(dataPratique, "Bearer x");

    expect(errors).toContain(
      "La sortie liée n'est pas encadrée par le moniteur en charge de cette formation",
    );
  });

  test("une formation N1 (niveauMin null) accepte une sortie de niveau Baptême", async () => {
    jest.spyOn(FormationRepository.prototype, "findById").mockResolvedValue({
      id_formation: 2,
      id_moniteur: 10,
      niveau_vise: "N1",
    });
    activitesClient.getSortieById.mockResolvedValue({
      type: "Formation",
      niveau_requis: "Baptême",
      encadrants: [10],
    });

    const errors = await service.validateSeanceData(
      { ...dataPratique, id_formation: 2 },
      "Bearer x",
    );

    expect(errors).toEqual([]);
  });
});

describe("SeanceService.validateSeanceData — seul le moniteur assigné peut créer une séance", () => {
  beforeEach(() => {
    jest.spyOn(FormationRepository.prototype, "findById").mockResolvedValue(formationN2);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    identiteClient.getMoniteurByUserId.mockClear();
  });

  test("refuse un autre moniteur que celui assigné à la formation", async () => {
    identiteClient.getMoniteurByUserId.mockResolvedValue({ id_moniteur: 99 }); // != 10

    await expect(
      service.validateSeanceData(dataPratique, "Bearer x", { id: 5, role: "moniteur" }),
    ).rejects.toThrow("Seul le moniteur assigné à cette formation peut la modifier");
  });

  test("accepte le moniteur assigné à la formation", async () => {
    identiteClient.getMoniteurByUserId.mockResolvedValue({ id_moniteur: 10 }); // == formationN2.id_moniteur
    activitesClient.getSortieById.mockResolvedValue({
      type: "Formation",
      niveau_requis: "Niveau 1",
      encadrants: [10],
    });

    const errors = await service.validateSeanceData(dataPratique, "Bearer x", {
      id: 5,
      role: "moniteur",
    });

    expect(errors).toEqual([]);
  });

  test("laisse passer le président (aucune restriction de propriétaire)", async () => {
    activitesClient.getSortieById.mockResolvedValue({
      type: "Formation",
      niveau_requis: "Niveau 1",
      encadrants: [10],
    });

    const errors = await service.validateSeanceData(dataPratique, "Bearer x", {
      id: 1,
      role: "president",
    });

    expect(errors).toEqual([]);
    expect(identiteClient.getMoniteurByUserId).not.toHaveBeenCalled();
  });
});

// Une séance "Pratique" se déroule réellement lors de la sortie liée : même
// garde-fou que le pointage de sortie (SortieService.enregistrerPointage,
// "Impossible de pointer une sortie future") — voir le commentaire associé
// dans SeanceService.updateStatut.
describe("SeanceService.updateStatut — séance pratique pas avant le jour de la sortie liée", () => {
  const formationEnCours = {
    id_formation: 1,
    id_moniteur: 10,
    statut: "En cours",
    nb_seances_realisees: 0,
    save: jest.fn().mockResolvedValue(),
  };

  beforeEach(() => {
    // "Réalisée" déclenche formationService.tryAutoComplete (best-effort,
    // capturé par le try/catch de updateStatut) — mocké en no-op pour ne
    // jamais retomber sur la vraie base Postgres locale via
    // competenceRepository.findByFormation avec ce id_formation fictif,
    // hors sujet ici (on teste seulement le garde-fou de date).
    jest
      .spyOn(require("../src/services/FormationService").prototype, "tryAutoComplete")
      .mockResolvedValue();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("refuse de pointer une séance pratique avant le jour de la sortie liée", async () => {
    const demain = new Date();
    demain.setDate(demain.getDate() + 1);
    jest.spyOn(SeanceRepository.prototype, "findById").mockResolvedValue({
      id_seance: 1,
      id_formation: 1,
      type_seance: "Pratique",
      id_sortie: 99,
      statut: "Planifiée",
      save: jest.fn(),
    });
    jest.spyOn(FormationRepository.prototype, "findById").mockResolvedValue(formationEnCours);
    activitesClient.getSortieById.mockResolvedValue({ date_heure: demain.toISOString() });

    await expect(
      service.updateStatut(1, { statut: "Réalisée" }, "Bearer x", {
        id: 1,
        role: "president",
      }),
    ).rejects.toThrow(
      "Impossible de pointer une séance pratique avant le jour de la sortie liée",
    );
  });

  test("accepte de pointer une séance pratique le jour même de la sortie liée", async () => {
    const seanceMock = {
      id_seance: 1,
      id_formation: 1,
      type_seance: "Pratique",
      id_sortie: 99,
      statut: "Planifiée",
      save: jest.fn().mockResolvedValue(),
    };
    jest.spyOn(SeanceRepository.prototype, "findById").mockResolvedValue(seanceMock);
    jest.spyOn(FormationRepository.prototype, "findById").mockResolvedValue({
      ...formationEnCours,
    });
    activitesClient.getSortieById.mockResolvedValue({ date_heure: new Date().toISOString() });

    await service.updateStatut(1, { statut: "Réalisée" }, "Bearer x", {
      id: 1,
      role: "president",
    });

    expect(seanceMock.statut).toBe("Réalisée");
    expect(seanceMock.save).toHaveBeenCalled();
  });

  test("accepte de pointer une séance pratique dont la sortie liée est déjà passée", async () => {
    const hier = new Date();
    hier.setDate(hier.getDate() - 1);
    const seanceMock = {
      id_seance: 1,
      id_formation: 1,
      type_seance: "Pratique",
      id_sortie: 99,
      statut: "Planifiée",
      save: jest.fn().mockResolvedValue(),
    };
    jest.spyOn(SeanceRepository.prototype, "findById").mockResolvedValue(seanceMock);
    jest.spyOn(FormationRepository.prototype, "findById").mockResolvedValue({
      ...formationEnCours,
    });
    activitesClient.getSortieById.mockResolvedValue({ date_heure: hier.toISOString() });

    await service.updateStatut(1, { statut: "Réalisée" }, "Bearer x", {
      id: 1,
      role: "president",
    });

    expect(seanceMock.statut).toBe("Réalisée");
  });

  test("n'applique pas ce garde-fou à une séance théorique (pas de sortie liée)", async () => {
    const seanceMock = {
      id_seance: 2,
      id_formation: 1,
      type_seance: "Théorique",
      id_sortie: null,
      statut: "Planifiée",
      save: jest.fn().mockResolvedValue(),
    };
    jest.spyOn(SeanceRepository.prototype, "findById").mockResolvedValue(seanceMock);
    jest.spyOn(FormationRepository.prototype, "findById").mockResolvedValue({
      ...formationEnCours,
    });
    // Appelé par d'autres tests de ce fichier (jamais réinitialisé entre
    // tests, voir jest.config.js) — repartir d'un compteur à zéro pour que
    // l'assertion ci-dessous porte bien sur CET appel, pas un résidu.
    activitesClient.getSortieById.mockClear();

    await service.updateStatut(2, { statut: "Réalisée" }, "Bearer x", {
      id: 1,
      role: "president",
    });

    expect(seanceMock.statut).toBe("Réalisée");
    expect(activitesClient.getSortieById).not.toHaveBeenCalled();
  });
});

// Note /20 facultative attribuée au pointage de présence — sert au calcul de
// la moyenne indicative proposée une fois toutes les séances réalisées (voir
// utils/helpers.js:computeNoteMoyenneSeances côté frontend). Jamais pour une
// séance "Absence" : une note n'a de sens que si la séance a réellement eu
// lieu.
describe("SeanceService.updateStatut — note de séance", () => {
  const formationEnCours = {
    id_formation: 1,
    id_moniteur: 10,
    statut: "En cours",
    nb_seances_realisees: 0,
    save: jest.fn().mockResolvedValue(),
  };
  const seanceTheorique = () => ({
    id_seance: 3,
    id_formation: 1,
    type_seance: "Théorique",
    id_sortie: null,
    statut: "Planifiée",
    save: jest.fn().mockResolvedValue(),
  });

  beforeEach(() => {
    jest
      .spyOn(require("../src/services/FormationService").prototype, "tryAutoComplete")
      .mockResolvedValue();
    jest.spyOn(FormationRepository.prototype, "findById").mockResolvedValue({
      ...formationEnCours,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("enregistre une note valide en marquant la séance Réalisée", async () => {
    const seanceMock = seanceTheorique();
    jest.spyOn(SeanceRepository.prototype, "findById").mockResolvedValue(seanceMock);

    await service.updateStatut(3, { statut: "Réalisée", note: 15.5 }, "Bearer x", {
      id: 1,
      role: "president",
    });

    expect(seanceMock.note).toBe(15.5);
  });

  test("rejette une note hors de l'intervalle 0-20", async () => {
    jest.spyOn(SeanceRepository.prototype, "findById").mockResolvedValue(seanceTheorique());

    await expect(
      service.updateStatut(3, { statut: "Réalisée", note: 21 }, "Bearer x", {
        id: 1,
        role: "president",
      }),
    ).rejects.toThrow("La note doit être un nombre entre 0 et 20");
  });

  test("rejette une note attribuée à une séance marquée Absence", async () => {
    jest.spyOn(SeanceRepository.prototype, "findById").mockResolvedValue(seanceTheorique());

    await expect(
      service.updateStatut(3, { statut: "Absence", note: 10 }, "Bearer x", {
        id: 1,
        role: "president",
      }),
    ).rejects.toThrow('Une note ne peut être attribuée qu\'à une séance "Réalisée"');
  });

  test("une chaîne vide efface une note déjà saisie", async () => {
    const seanceMock = { ...seanceTheorique(), statut: "Réalisée", note: 12 };
    jest.spyOn(SeanceRepository.prototype, "findById").mockResolvedValue(seanceMock);

    await service.updateStatut(3, { statut: "Réalisée", note: "" }, "Bearer x", {
      id: 1,
      role: "president",
    });

    expect(seanceMock.note).toBeNull();
  });

  test("ne touche pas à la note existante quand elle n'est pas fournie", async () => {
    const seanceMock = { ...seanceTheorique(), statut: "Réalisée", note: 12 };
    jest.spyOn(SeanceRepository.prototype, "findById").mockResolvedValue(seanceMock);

    await service.updateStatut(3, { statut: "Réalisée" }, "Bearer x", {
      id: 1,
      role: "president",
    });

    expect(seanceMock.note).toBe(12);
  });
});
