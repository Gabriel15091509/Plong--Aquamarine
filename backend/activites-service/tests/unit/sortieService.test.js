jest.mock("../../src/utils/meteoClient", () => ({
  getForecastForDate: jest.fn(),
  evaluerDanger: jest.requireActual("../../src/utils/meteoClient").evaluerDanger,
}));
jest.mock("../../src/utils/serviceClients/identiteClient", () => ({
  getAdherentById: jest.fn(),
  getAdherentForUser: jest.fn(),
  getUserBasicById: jest.fn(),
  getMoniteurById: jest.fn(),
  getMoniteurByUserId: jest.fn(),
}));
jest.mock("../../src/utils/serviceClients/vieAssociativeClient", () => ({
  createAlerte: jest.fn(),
}));
jest.mock("../../src/utils/email", () => ({
  sendSortieAnnuleeMeteoEmail: jest.fn(),
  sendSortieModifieeEmail: jest.fn(),
  sendReconfirmationInscriptionEmail: jest.fn(),
  sendPropositionsReprogrammationEmail: jest.fn(),
  sendAlerteMeteoDouteuseEmail: jest.fn(),
  sendSortieSansInscriptionEmail: jest.fn(),
  sendSortieSousRemplieEmail: jest.fn(),
}));

const SortieService = require("../../src/services/SortieService");
const { getForecastForDate } = require("../../src/utils/meteoClient");
const identiteClient = require("../../src/utils/serviceClients/identiteClient");
const vieAssociativeClient = require("../../src/utils/serviceClients/vieAssociativeClient");
const {
  sendSortieAnnuleeMeteoEmail,
  sendSortieModifieeEmail,
  sendReconfirmationInscriptionEmail,
  sendAlerteMeteoDouteuseEmail,
  sendSortieSansInscriptionEmail,
  sendSortieSousRemplieEmail,
} = require("../../src/utils/email");

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

  test("accepte des encadrants désignés existants", async () => {
    identiteClient.getMoniteurById.mockImplementation((id) =>
      Promise.resolve({ id_moniteur: id, niveau: "Moniteur" }),
    );
    const errors = await service.validateSortieData({ ...validData, encadrants: [1, 2] });
    expect(errors).toEqual([]);
  });

  test("rejette un encadrant déjà désigné sur une autre sortie dont le créneau chevauche celui-ci", async () => {
    identiteClient.getMoniteurById.mockResolvedValue({ id_moniteur: 1, niveau: "Moniteur" });
    const spy = jest
      .spyOn(service.sortieRepository, "findAutresAvecEncadrants")
      .mockResolvedValue([
        {
          id_sortie: 42,
          date_heure: validData.date_heure,
          duree_estimee: "02:00:00",
          encadrants: [1],
          site: "La Corne",
          lieu: "Saint-Leu",
        },
      ]);
    try {
      // duree_estimee explicite : sans elle, validData retombe sur une
      // durée de 0 (voir sortieOverlap.dureeEnMs) — un intervalle de durée
      // nulle ne chevauche jamais rien (intervalle semi-ouvert), ce test
      // passerait donc à côté du chevauchement qu'il vérifie.
      const errors = await service.validateSortieData({
        ...validData,
        duree_estimee: "01:00:00",
        encadrants: [1],
      });
      expect(errors).toEqual([
        {
          field: "encadrants",
          message: expect.stringContaining("Moniteur #1 est déjà encadrant"),
        },
      ]);
    } finally {
      spy.mockRestore();
    }
  });

  test("accepte un encadrant déjà désigné sur une autre sortie qui ne chevauche pas ce créneau", async () => {
    identiteClient.getMoniteurById.mockResolvedValue({ id_moniteur: 1, niveau: "Moniteur" });
    const spy = jest
      .spyOn(service.sortieRepository, "findAutresAvecEncadrants")
      .mockResolvedValue([
        {
          id_sortie: 42,
          date_heure: "2020-01-01T08:00:00.000Z",
          duree_estimee: "02:00:00",
          encadrants: [1],
          site: "La Corne",
          lieu: "Saint-Leu",
        },
      ]);
    try {
      const errors = await service.validateSortieData({
        ...validData,
        duree_estimee: "01:00:00",
        encadrants: [1],
      });
      expect(errors).toEqual([]);
    } finally {
      spy.mockRestore();
    }
  });

  test("rejette un encadrant désigné qui ne correspond à aucun moniteur", async () => {
    identiteClient.getMoniteurById.mockResolvedValue(null);
    const errors = await service.validateSortieData({ ...validData, encadrants: [999] });
    expect(errors).toEqual([
      { field: "encadrants", message: "Moniteur #999 introuvable" },
    ]);
  });

  test("rejette des encadrants désignés qui ne sont pas une liste", async () => {
    identiteClient.getMoniteurById.mockClear();
    const errors = await service.validateSortieData({ ...validData, encadrants: "1" });
    expect(errors.some((e) => e.field === "encadrants")).toBe(true);
    expect(identiteClient.getMoniteurById).not.toHaveBeenCalled();
  });
});

// Un type de sortie n'est pas compatible avec n'importe quel niveau requis
// (voir isTypeNiveauCompatible/NIVEAU_MIN_PAR_TYPE_SORTIE, roleScope.js) :
// "Baptême" n'accepte QUE "Baptême", "Plongée technique" exige au moins
// "Niveau 2".
describe("SortieService.validateSortieData — cohérence type/niveau requis", () => {
  test("rejette une sortie Baptême avec un niveau requis différent de Baptême", async () => {
    const errors = await service.validateSortieData({
      ...validData,
      type: "Baptême",
      niveau_requis: "Niveau 2",
    });
    expect(errors).toContainEqual(
      expect.objectContaining({ field: "niveau_requis" }),
    );
  });

  test("accepte une sortie Baptême avec niveau requis Baptême", async () => {
    const errors = await service.validateSortieData({
      ...validData,
      type: "Baptême",
      niveau_requis: "Baptême",
    });
    expect(errors).toEqual([]);
  });

  test("rejette une Plongée technique en dessous du niveau minimum (Niveau 2)", async () => {
    const errors = await service.validateSortieData({
      ...validData,
      type: "Plongée technique",
      niveau_requis: "Niveau 1",
    });
    expect(errors).toContainEqual(
      expect.objectContaining({ field: "niveau_requis" }),
    );
  });

  test("accepte une Plongée technique au niveau minimum ou au-dessus", async () => {
    const errors = await service.validateSortieData({
      ...validData,
      type: "Plongée technique",
      niveau_requis: "Niveau 3",
    });
    expect(errors).toEqual([]);
  });

  test("une Formation reste ouverte à tous les niveaux, y compris Baptême", async () => {
    const errors = await service.validateSortieData({
      ...validData,
      type: "Formation",
      niveau_requis: "Baptême",
    });
    expect(errors).toEqual([]);
  });
});

// Régression : profondeur_max et niveau_requis étaient totalement
// déconnectés (aucun lien entre le niveau choisi et la profondeur par
// défaut) — create() déduit désormais profondeur_max du niveau requis
// quand l'appelant ne le fournit pas explicitement (voir
// PROFONDEUR_MAX_PAR_NIVEAU, roleScope.js). Le formulaire web pré-remplit
// déjà ce champ côté frontend ; ce filet côté service couvre tout autre
// appelant de l'API (script, client mobile...).
describe("SortieService.create — profondeur_max déduite du niveau requis", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("déduit profondeur_max du niveau requis quand il est absent", async () => {
    const createSpy = jest
      .spyOn(service.sortieRepository, "create")
      .mockImplementation(async (data) => ({ id_sortie: 1, ...data }));

    await service.create({ ...validData, niveau_requis: "Niveau 2" });

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({ niveau_requis: "Niveau 2", profondeur_max: 40 }),
    );
  });

  test("ne modifie jamais une profondeur_max explicitement fournie", async () => {
    const createSpy = jest
      .spyOn(service.sortieRepository, "create")
      .mockImplementation(async (data) => ({ id_sortie: 1, ...data }));

    await service.create({ ...validData, niveau_requis: "Niveau 2", profondeur_max: 25 });

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({ profondeur_max: 25 }),
    );
  });

  test("laisse profondeur_max absente si le niveau requis est aussi absent/inconnu", async () => {
    const createSpy = jest
      .spyOn(service.sortieRepository, "create")
      .mockImplementation(async (data) => ({ id_sortie: 1, ...data }));

    await service.create({ ...validData, niveau_requis: "Niveau inconnu" });

    expect(createSpy).toHaveBeenCalledWith(
      expect.not.objectContaining({ profondeur_max: expect.anything() }),
    );
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

describe("SortieService.getPrevisionMeteo", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  const forecastFavorable = {
    date: "2026-09-01",
    windspeed: 10,
    windgusts: 15,
    weathercode: 1,
    precipitation: 0,
    waveHeight: 0.5,
  };

  // CDC : une sortie annulée automatiquement pour météo ne doit jamais
  // afficher "Conditions favorables" en re-calculant sur une prévision
  // révisée depuis (ou un relevé observé après coup) — le motif_annulation
  // enregistré à l'époque de la décision fait foi.
  test("sortie Annulée pour météo : verdict figé sur le motif_annulation, pas de recalcul favorable", async () => {
    jest.spyOn(service.sortieRepository, "findById").mockResolvedValue({
      latitude: -21.17,
      longitude: 55.28,
      date_heure: "2026-09-01T08:00:00.000Z",
      statut: "Annulée",
      motif_annulation:
        "Annulation automatique (météo défavorable) : Vent fort prévu (45 km/h), Orage prévu.",
    });
    getForecastForDate.mockResolvedValue(forecastFavorable);

    const result = await service.getPrevisionMeteo(1);

    expect(result).toEqual({
      disponible: true,
      forecast: forecastFavorable,
      dangereux: true,
      motifs: ["Vent fort prévu (45 km/h)", "Orage prévu"],
      annuleePourMeteo: true,
    });
  });

  test("sortie Annulée pour un autre motif : recalcule normalement (peut être favorable)", async () => {
    jest.spyOn(service.sortieRepository, "findById").mockResolvedValue({
      latitude: -21.17,
      longitude: 55.28,
      date_heure: "2026-09-01T08:00:00.000Z",
      statut: "Annulée",
      motif_annulation: "Manque d'encadrants disponibles.",
    });
    getForecastForDate.mockResolvedValue(forecastFavorable);

    const result = await service.getPrevisionMeteo(1);

    expect(result).toEqual({
      disponible: true,
      forecast: forecastFavorable,
      dangereux: false,
      motifs: [],
    });
  });

  test("sortie Planifiée : recalcule normalement", async () => {
    jest.spyOn(service.sortieRepository, "findById").mockResolvedValue({
      latitude: -21.17,
      longitude: 55.28,
      date_heure: "2026-09-01T08:00:00.000Z",
      statut: "Planifiée",
      motif_annulation: null,
    });
    getForecastForDate.mockResolvedValue(forecastFavorable);

    const result = await service.getPrevisionMeteo(1);

    expect(result.dangereux).toBe(false);
    expect(result.annuleePourMeteo).toBeUndefined();
  });
});

// Date système fixée à 2026-08-18 (voir currentDate de session).
function dansNJours(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(8, 0, 0, 0);
  return d.toISOString();
}

describe("SortieService.testerUneEtapeAuto (3 tests sur 3 jours différents)", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  const sortieNeuve = {
    id_sortie: 10,
    latitude: -21.17,
    longitude: 55.28,
    date_heure: dansNJours(5),
    duree_estimee: "02:00:00",
    created_by: 5,
    meteo_test_j5_fait: false,
    meteo_test_j4_fait: false,
    meteo_test_j3_fait: false,
    meteo_motifs_detectes: null,
    inscriptions: [{ id_inscription: 1, num_adherent: "ADH-2026-0001", statut: "Confirmée" }],
  };

  test("1er test (J-5) dangereux : accumule le motif mais n'annule pas encore (2 tests restants)", async () => {
    getForecastForDate.mockResolvedValue({ windspeed: 50 });
    jest.spyOn(service.sortieRepository, "update").mockResolvedValue({});

    const cancelled = await service.testerUneEtapeAuto(sortieNeuve, "Bearer x");

    expect(cancelled).toBe(false);
    expect(service.sortieRepository.update).toHaveBeenCalledWith(10, {
      meteo_test_j5_fait: true,
      meteo_motifs_detectes: [expect.stringMatching(/^Vent fort prévu.*\(détecté à J-5\)$/)],
    });
    expect(sendSortieAnnuleeMeteoEmail).not.toHaveBeenCalled();
  });

  test("2e test (J-4) après un 1er favorable : joue bien la 2e étape, pas la 1re", async () => {
    getForecastForDate.mockResolvedValue({ windspeed: 10 });
    jest.spyOn(service.sortieRepository, "update").mockResolvedValue({});
    const sortie = { ...sortieNeuve, date_heure: dansNJours(4), meteo_test_j5_fait: true };

    await service.testerUneEtapeAuto(sortie, "Bearer x");

    expect(service.sortieRepository.update).toHaveBeenCalledWith(10, {
      meteo_test_j4_fait: true,
      meteo_motifs_detectes: null,
    });
  });

  test("3e test (J-3) : décide sur l'accumulé — annule même si CE test est favorable mais qu'un précédent était dangereux", async () => {
    getForecastForDate.mockResolvedValue({ windspeed: 10 }); // favorable ce jour-là
    jest.spyOn(service.sortieRepository, "update").mockResolvedValue({});
    jest.spyOn(service.sortieRepository, "findAutresPourChevauchement").mockResolvedValue([]);
    identiteClient.getAdherentById.mockResolvedValue({
      email: "membre@test.fr",
      nom: "Payet",
      prenom: "Marie",
    });
    identiteClient.getUserBasicById.mockResolvedValue({ email: "organisateur@test.fr", name: "Léa" });
    const sortie = {
      ...sortieNeuve,
      date_heure: dansNJours(3),
      meteo_test_j5_fait: true,
      meteo_test_j4_fait: true,
      meteo_motifs_detectes: ["Vent fort prévu (50 km/h) (détecté à J-5)"], // danger détecté à J-5
    };

    const cancelled = await service.testerUneEtapeAuto(sortie, "Bearer x");

    expect(cancelled).toBe(true);
    expect(service.sortieRepository.update).toHaveBeenCalledWith(
      10,
      expect.objectContaining({
        statut: "Annulée",
        meteo_test_j3_fait: true,
        motif_annulation: "Annulation automatique (météo défavorable) : Vent fort prévu (50 km/h) (détecté à J-5).",
      }),
    );
    expect(sendSortieAnnuleeMeteoEmail).toHaveBeenCalledTimes(1);
  });

  test("3e test (J-3) : décide favorable seulement si aucun des 3 n'a jamais détecté de danger", async () => {
    getForecastForDate.mockResolvedValue({ windspeed: 10 });
    jest.spyOn(service.sortieRepository, "update").mockResolvedValue({});
    const sortie = {
      ...sortieNeuve,
      date_heure: dansNJours(3),
      meteo_test_j5_fait: true,
      meteo_test_j4_fait: true,
      meteo_motifs_detectes: null,
    };

    const cancelled = await service.testerUneEtapeAuto(sortie, "Bearer x");

    expect(cancelled).toBe(false);
    expect(service.sortieRepository.update).toHaveBeenCalledWith(10, {
      meteo_test_j3_fait: true,
      meteo_motifs_detectes: null,
    });
    expect(sendSortieAnnuleeMeteoEmail).not.toHaveBeenCalled();
  });
});

describe("SortieService.testerEtAlerterJ1 (test J-1, jamais d'annulation automatique)", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  const baseSortie = {
    id_sortie: 11,
    latitude: -21.17,
    longitude: 55.28,
    date_heure: dansNJours(1),
    created_by: 5,
  };

  const flagsAttendus = {
    meteo_test_j5_fait: true,
    meteo_test_j4_fait: true,
    meteo_test_j3_fait: true,
    meteo_alerte_j1_envoyee: true,
  };

  test("doute (dangereux) : alerte l'organisateur seul, ne touche jamais au statut", async () => {
    getForecastForDate.mockResolvedValue({ windspeed: 45 });
    jest.spyOn(service.sortieRepository, "update").mockResolvedValue({});
    identiteClient.getUserBasicById.mockResolvedValue({ email: "organisateur@test.fr", name: "Léa" });

    await service.testerEtAlerterJ1(baseSortie);

    expect(service.sortieRepository.update).toHaveBeenCalledWith(11, flagsAttendus);
    expect(sendAlerteMeteoDouteuseEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "organisateur@test.fr" }),
    );
    expect(sendSortieAnnuleeMeteoEmail).not.toHaveBeenCalled();
  });

  test("favorable : marque les indicateurs, aucune alerte envoyée", async () => {
    getForecastForDate.mockResolvedValue({ windspeed: 10 });
    jest.spyOn(service.sortieRepository, "update").mockResolvedValue({});

    await service.testerEtAlerterJ1(baseSortie);

    expect(service.sortieRepository.update).toHaveBeenCalledWith(11, flagsAttendus);
    expect(sendAlerteMeteoDouteuseEmail).not.toHaveBeenCalled();
  });
});

describe("SortieService.verifierMeteoEtAnnulerSiDangereux (aiguillage 3 tests / J-1)", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  function mockSorties(sorties) {
    jest.spyOn(service.sortieRepository, "findPlanifieesAVenirAvecCoordonnees").mockResolvedValue(sorties);
  }

  const auto = (overrides) => ({
    id_sortie: 1,
    meteo_test_j5_fait: false,
    meteo_test_j4_fait: false,
    meteo_test_j3_fait: false,
    meteo_alerte_j1_envoyee: false,
    ...overrides,
  });

  test("à J-5, jamais testée : passe par une étape auto", async () => {
    mockSorties([auto({ date_heure: dansNJours(5) })]);
    const auto1 = jest.spyOn(service, "testerUneEtapeAuto").mockResolvedValue(true);
    const j1 = jest.spyOn(service, "testerEtAlerterJ1").mockResolvedValue();

    const annulees = await service.verifierMeteoEtAnnulerSiDangereux("Bearer x");

    expect(auto1).toHaveBeenCalledTimes(1);
    expect(j1).not.toHaveBeenCalled();
    expect(annulees).toBe(1);
  });

  test("2 étapes déjà faites, 3e restante à J-3 : passe encore par une étape auto", async () => {
    mockSorties([auto({ date_heure: dansNJours(3), meteo_test_j5_fait: true, meteo_test_j4_fait: true })]);
    const autoSpy = jest.spyOn(service, "testerUneEtapeAuto").mockResolvedValue(false);
    const j1 = jest.spyOn(service, "testerEtAlerterJ1").mockResolvedValue();

    await service.verifierMeteoEtAnnulerSiDangereux("Bearer x");

    expect(autoSpy).toHaveBeenCalledTimes(1);
    expect(j1).not.toHaveBeenCalled();
  });

  test("les 3 étapes déjà faites, encore à J-2 : ne rejoue rien (trop tôt pour l'alerte J-1)", async () => {
    mockSorties([
      auto({
        date_heure: dansNJours(2),
        meteo_test_j5_fait: true,
        meteo_test_j4_fait: true,
        meteo_test_j3_fait: true,
      }),
    ]);
    const autoSpy = jest.spyOn(service, "testerUneEtapeAuto").mockResolvedValue(false);
    const j1 = jest.spyOn(service, "testerEtAlerterJ1").mockResolvedValue();

    await service.verifierMeteoEtAnnulerSiDangereux("Bearer x");

    expect(autoSpy).not.toHaveBeenCalled();
    expect(j1).not.toHaveBeenCalled();
  });

  test("les 3 étapes déjà faites, à J-1 : passe par l'alerte seule", async () => {
    mockSorties([
      auto({
        date_heure: dansNJours(1),
        meteo_test_j5_fait: true,
        meteo_test_j4_fait: true,
        meteo_test_j3_fait: true,
      }),
    ]);
    const autoSpy = jest.spyOn(service, "testerUneEtapeAuto").mockResolvedValue(false);
    const j1 = jest.spyOn(service, "testerEtAlerterJ1").mockResolvedValue();

    await service.verifierMeteoEtAnnulerSiDangereux("Bearer x");

    expect(autoSpy).not.toHaveBeenCalled();
    expect(j1).toHaveBeenCalledTimes(1);
  });

  test("créée trop tard pour les 3 tests (déjà à J-1, aucune étape faite) : bascule directement en alerte J-1", async () => {
    mockSorties([auto({ date_heure: dansNJours(1) })]);
    const autoSpy = jest.spyOn(service, "testerUneEtapeAuto").mockResolvedValue(false);
    const j1 = jest.spyOn(service, "testerEtAlerterJ1").mockResolvedValue();

    await service.verifierMeteoEtAnnulerSiDangereux("Bearer x");

    expect(autoSpy).not.toHaveBeenCalled();
    expect(j1).toHaveBeenCalledTimes(1);
  });

  test("alerte J-1 déjà envoyée : ne rejoue rien", async () => {
    mockSorties([
      auto({
        date_heure: dansNJours(1),
        meteo_test_j5_fait: true,
        meteo_test_j4_fait: true,
        meteo_test_j3_fait: true,
        meteo_alerte_j1_envoyee: true,
      }),
    ]);
    const autoSpy = jest.spyOn(service, "testerUneEtapeAuto").mockResolvedValue(false);
    const j1 = jest.spyOn(service, "testerEtAlerterJ1").mockResolvedValue();

    await service.verifierMeteoEtAnnulerSiDangereux("Bearer x");

    expect(autoSpy).not.toHaveBeenCalled();
    expect(j1).not.toHaveBeenCalled();
  });
});

describe("SortieService.alerterSortiesSansInscription (jamais d'annulation automatique)", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  const sortieSansInscription = {
    id_sortie: 21,
    date_heure: dansNJours(3),
    created_by: 5,
    inscriptions: [],
  };

  test("alerte l'organisateur et marque la sortie comme signalée", async () => {
    jest
      .spyOn(service.sortieRepository, "findPlanifieesSansAlerteInscriptionAvant")
      .mockResolvedValue([sortieSansInscription]);
    const updateSpy = jest.spyOn(service.sortieRepository, "update").mockResolvedValue({});
    identiteClient.getUserBasicById.mockResolvedValue({ email: "organisateur@test.fr", name: "Léa" });

    const result = await service.alerterSortiesSansInscription();

    expect(updateSpy).toHaveBeenCalledWith(21, { alerte_sans_inscription_envoyee: true });
    expect(sendSortieSansInscriptionEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "organisateur@test.fr", id_sortie: 21 }),
    );
    expect(result).toBe(1);
  });

  test("ne fait rien (pas d'alerte) si la sortie a déjà au moins une inscription non annulée", async () => {
    jest.spyOn(service.sortieRepository, "findPlanifieesSansAlerteInscriptionAvant").mockResolvedValue([
      {
        ...sortieSansInscription,
        inscriptions: [{ statut: "Confirmée" }],
      },
    ]);
    const updateSpy = jest.spyOn(service.sortieRepository, "update").mockResolvedValue({});

    const result = await service.alerterSortiesSansInscription();

    expect(updateSpy).not.toHaveBeenCalled();
    expect(sendSortieSansInscriptionEmail).not.toHaveBeenCalled();
    expect(result).toBe(0);
  });

  test("ignore une inscription \"Annulée\" : compte toujours comme sans inscription", async () => {
    jest.spyOn(service.sortieRepository, "findPlanifieesSansAlerteInscriptionAvant").mockResolvedValue([
      {
        ...sortieSansInscription,
        inscriptions: [{ statut: "Annulée" }],
      },
    ]);
    jest.spyOn(service.sortieRepository, "update").mockResolvedValue({});
    identiteClient.getUserBasicById.mockResolvedValue({ email: "organisateur@test.fr", name: "Léa" });

    const result = await service.alerterSortiesSansInscription();

    expect(sendSortieSansInscriptionEmail).toHaveBeenCalled();
    expect(result).toBe(1);
  });

  test("ne fait rien si la sortie n'a pas d'organisateur connu (created_by absent)", async () => {
    jest.spyOn(service.sortieRepository, "findPlanifieesSansAlerteInscriptionAvant").mockResolvedValue([
      { ...sortieSansInscription, created_by: null },
    ]);
    jest.spyOn(service.sortieRepository, "update").mockResolvedValue({});

    const result = await service.alerterSortiesSansInscription();

    expect(sendSortieSansInscriptionEmail).not.toHaveBeenCalled();
    expect(result).toBe(0);
  });
});

describe("SortieService.alerterSortiesSousRemplies (jamais d'annulation automatique)", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  const sortieDemain = {
    id_sortie: 31,
    date_heure: dansNJours(1),
    created_by: 5,
    nb_places: 8,
    inscriptions: [],
  };

  test("alerte l'organisateur et marque la sortie comme signalée sous 50 % de remplissage", async () => {
    jest
      .spyOn(service.sortieRepository, "findPlanifieesSansAlerteRemplissageAvant")
      .mockResolvedValue([{ ...sortieDemain, inscriptions: [{ statut: "Confirmée" }] }]);
    const updateSpy = jest.spyOn(service.sortieRepository, "update").mockResolvedValue({});
    identiteClient.getUserBasicById.mockResolvedValue({ email: "organisateur@test.fr", name: "Léa" });

    const result = await service.alerterSortiesSousRemplies();

    expect(updateSpy).toHaveBeenCalledWith(31, { alerte_remplissage_envoyee: true });
    expect(sendSortieSousRemplieEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "organisateur@test.fr",
        id_sortie: 31,
        nbInscrits: 1,
        nbPlaces: 8,
        tauxPourcent: 13,
      }),
    );
    expect(result).toBe(1);
  });

  test("ne fait rien si le remplissage atteint déjà le seuil de 50 %", async () => {
    jest.spyOn(service.sortieRepository, "findPlanifieesSansAlerteRemplissageAvant").mockResolvedValue([
      {
        ...sortieDemain,
        inscriptions: [{ statut: "Confirmée" }, { statut: "Confirmée" }, { statut: "Confirmée" }, { statut: "Confirmée" }],
      },
    ]);
    const updateSpy = jest.spyOn(service.sortieRepository, "update").mockResolvedValue({});

    const result = await service.alerterSortiesSousRemplies();

    expect(updateSpy).not.toHaveBeenCalled();
    expect(sendSortieSousRemplieEmail).not.toHaveBeenCalled();
    expect(result).toBe(0);
  });

  test("ne compte pas les inscriptions en liste d'attente ou annulées comme remplissage", async () => {
    jest.spyOn(service.sortieRepository, "findPlanifieesSansAlerteRemplissageAvant").mockResolvedValue([
      {
        ...sortieDemain,
        inscriptions: [{ statut: "En attente" }, { statut: "Annulée" }],
      },
    ]);
    jest.spyOn(service.sortieRepository, "update").mockResolvedValue({});
    identiteClient.getUserBasicById.mockResolvedValue({ email: "organisateur@test.fr", name: "Léa" });

    const result = await service.alerterSortiesSousRemplies();

    expect(sendSortieSousRemplieEmail).toHaveBeenCalledWith(
      expect.objectContaining({ nbInscrits: 0, nbPlaces: 8 }),
    );
    expect(result).toBe(1);
  });

  test("ne fait rien si la sortie n'a pas d'organisateur connu (created_by absent)", async () => {
    jest.spyOn(service.sortieRepository, "findPlanifieesSansAlerteRemplissageAvant").mockResolvedValue([
      { ...sortieDemain, created_by: null },
    ]);
    jest.spyOn(service.sortieRepository, "update").mockResolvedValue({});

    const result = await service.alerterSortiesSousRemplies();

    expect(sendSortieSousRemplieEmail).not.toHaveBeenCalled();
    expect(result).toBe(0);
  });
});

describe("SortieService.demarrerSortiesEchues", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("délègue au repository et renvoie le nombre de sorties démarrées", async () => {
    const repoSpy = jest
      .spyOn(service.sortieRepository, "demarrerSortiesEchues")
      .mockResolvedValue([1, 2, 3]);
    const annulerSpy = jest
      .spyOn(service.inscriptionRepository, "annulerNonConfirmeesBySortie")
      .mockResolvedValue(0);

    const result = await service.demarrerSortiesEchues();

    expect(repoSpy).toHaveBeenCalled();
    expect(result).toBe(3);
    // Une annulation en bloc des inscriptions non confirmées par sortie
    // démarrée (voir annulerInscriptionsNonConfirmees), pas une seule fois.
    expect(annulerSpy).toHaveBeenCalledTimes(3);
    expect(annulerSpy).toHaveBeenNthCalledWith(1, 1);
    expect(annulerSpy).toHaveBeenNthCalledWith(2, 2);
    expect(annulerSpy).toHaveBeenNthCalledWith(3, 3);
  });

  test("ne fait aucun appel d'annulation si aucune sortie n'a démarré", async () => {
    jest.spyOn(service.sortieRepository, "demarrerSortiesEchues").mockResolvedValue([]);
    const annulerSpy = jest.spyOn(
      service.inscriptionRepository,
      "annulerNonConfirmeesBySortie",
    );

    const result = await service.demarrerSortiesEchues();

    expect(result).toBe(0);
    expect(annulerSpy).not.toHaveBeenCalled();
  });
});

describe("SortieService.annulerInscriptionsNonConfirmees", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("annule en bloc les inscriptions non confirmées de la sortie", async () => {
    const repoSpy = jest
      .spyOn(service.inscriptionRepository, "annulerNonConfirmeesBySortie")
      .mockResolvedValue(2);

    await service.annulerInscriptionsNonConfirmees(42);

    expect(repoSpy).toHaveBeenCalledWith(42);
  });

  test("avale une erreur du repository sans la propager (best-effort)", async () => {
    jest
      .spyOn(service.inscriptionRepository, "annulerNonConfirmeesBySortie")
      .mockRejectedValue(new Error("boom"));
    jest.spyOn(console, "error").mockImplementation(() => {});

    await expect(service.annulerInscriptionsNonConfirmees(42)).resolves.toBeUndefined();
  });
});

describe("SortieService.update — passage manuel à 'En cours'", () => {
  beforeEach(() => {
    // Ces sorties mock n'ont pas de lieu/site/etc. initiaux : plusieurs de
    // ces tests changent donc un champ "notifiable" au sens de
    // notifierModificationSortie (voir plus bas) sans le vouloir — sans ce
    // mock, l'appel non intercepté à findByIdWithInscriptions irait taper
    // la vraie base de test au lieu de rester silencieux, hors du périmètre
    // de ce describe (dédié au seul comportement "annulerInscriptionsNon
    // Confirmees").
    jest.spyOn(service.sortieRepository, "findByIdWithInscriptions").mockResolvedValue({
      inscriptions: [],
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("annule les inscriptions non confirmées quand le statut passe à 'En cours'", async () => {
    const sortie = {
      id_sortie: 7,
      statut: "Planifiée",
      update: jest.fn().mockImplementation(function (data) {
        Object.assign(this, data);
        return Promise.resolve(this);
      }),
    };
    jest.spyOn(service.sortieRepository, "findById").mockResolvedValue(sortie);
    const annulerSpy = jest
      .spyOn(service, "annulerInscriptionsNonConfirmees")
      .mockResolvedValue();

    await service.update(7, { statut: "En cours" });

    expect(annulerSpy).toHaveBeenCalledWith(7);
  });

  test("ne touche pas les inscriptions si le statut ne change pas vers 'En cours'", async () => {
    const sortie = {
      id_sortie: 7,
      statut: "Planifiée",
      update: jest.fn().mockImplementation(function (data) {
        Object.assign(this, data);
        return Promise.resolve(this);
      }),
    };
    jest.spyOn(service.sortieRepository, "findById").mockResolvedValue(sortie);
    const annulerSpy = jest
      .spyOn(service, "annulerInscriptionsNonConfirmees")
      .mockResolvedValue();

    await service.update(7, { lieu: "Nouveau lieu" });

    expect(annulerSpy).not.toHaveBeenCalled();
  });

  test("ne réannule pas si la sortie était déjà 'En cours'", async () => {
    const sortie = {
      id_sortie: 7,
      statut: "En cours",
      update: jest.fn().mockImplementation(function (data) {
        Object.assign(this, data);
        return Promise.resolve(this);
      }),
    };
    jest.spyOn(service.sortieRepository, "findById").mockResolvedValue(sortie);
    const annulerSpy = jest
      .spyOn(service, "annulerInscriptionsNonConfirmees")
      .mockResolvedValue();

    await service.update(7, { statut: "En cours" });

    expect(annulerSpy).not.toHaveBeenCalled();
  });
});

describe("SortieService.update — chevauchement d'encadrant (findEncadrantOverlapErrors)", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const buildSortie = (overrides) => ({
    id_sortie: 8,
    statut: "Planifiée",
    date_heure: "2026-09-01T08:00:00.000Z",
    duree_estimee: "02:00:00",
    encadrants: [1],
    update: jest.fn().mockImplementation(function (data) {
      Object.assign(this, data);
      return Promise.resolve(this);
    }),
    ...overrides,
  });

  test("refuse un changement de créneau qui crée un chevauchement avec une autre sortie du même encadrant", async () => {
    jest.spyOn(service.sortieRepository, "findById").mockResolvedValue(buildSortie());
    jest.spyOn(service.sortieRepository, "findAutresAvecEncadrants").mockResolvedValue([
      {
        id_sortie: 9,
        date_heure: "2026-09-01T09:00:00.000Z",
        duree_estimee: "01:00:00",
        encadrants: [1],
        site: "La Corne",
        lieu: "Saint-Leu",
      },
    ]);

    await expect(
      service.update(8, { date_heure: "2026-09-01T08:30:00.000Z" }),
    ).rejects.toThrow(/Moniteur #1 est déjà encadrant/);
  });

  test("laisse passer un changement qui ne crée aucun chevauchement", async () => {
    jest.spyOn(service.sortieRepository, "findById").mockResolvedValue(buildSortie());
    jest.spyOn(service.sortieRepository, "findByIdWithInscriptions").mockResolvedValue({
      inscriptions: [],
    });
    jest.spyOn(service.sortieRepository, "findAutresAvecEncadrants").mockResolvedValue([
      {
        id_sortie: 9,
        date_heure: "2020-01-01T09:00:00.000Z",
        duree_estimee: "01:00:00",
        encadrants: [1],
        site: "La Corne",
        lieu: "Saint-Leu",
      },
    ]);

    await expect(
      service.update(8, { lieu: "Nouveau lieu" }),
    ).resolves.toMatchObject({ lieu: "Nouveau lieu" });
  });

  // Incident réel : "Marquer terminée" (n'envoie que { statut }, jamais
  // encadrants/date_heure/duree_estimee) se heurtait à cette même
  // validation, ré-appliquée sur les valeurs déjà en base — donc jamais un
  // NOUVEAU chevauchement, seulement un ancien, présent depuis la
  // planification d'origine (avant même l'ajout de ce garde-fou, ou
  // simplement jamais problématique en pratique). Un changement de statut
  // seul ne doit donc jamais déclencher cette vérification.
  test("un changement de statut seul (ex. Marquer terminée) ignore un chevauchement déjà existant", async () => {
    jest.spyOn(service.sortieRepository, "findById").mockResolvedValue(
      buildSortie({ statut: "En cours" }),
    );
    const findAutresSpy = jest
      .spyOn(service.sortieRepository, "findAutresAvecEncadrants")
      .mockResolvedValue([
        {
          id_sortie: 9,
          date_heure: "2026-09-01T08:30:00.000Z",
          duree_estimee: "01:00:00",
          encadrants: [1],
          site: "La Corne",
          lieu: "Saint-Leu",
        },
      ]);

    await expect(
      service.update(8, { statut: "Terminée" }),
    ).resolves.toMatchObject({ statut: "Terminée" });
    expect(findAutresSpy).not.toHaveBeenCalled();
  });
});

describe("SortieService.update — cohérence type/niveau requis", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const buildSortie = (overrides) => ({
    id_sortie: 8,
    statut: "Planifiée",
    type: "Plongée d'exploration",
    niveau_requis: "Niveau 1",
    date_heure: "2026-09-01T08:00:00.000Z",
    duree_estimee: "02:00:00",
    encadrants: [],
    update: jest.fn().mockImplementation(function (data) {
      Object.assign(this, data);
      return Promise.resolve(this);
    }),
    ...overrides,
  });

  test("refuse de changer le type pour Baptême si le niveau requis en base n'est pas Baptême", async () => {
    jest.spyOn(service.sortieRepository, "findById").mockResolvedValue(buildSortie());

    await expect(service.update(8, { type: "Baptême" })).rejects.toThrow(
      /doit avoir "Baptême" comme niveau requis/,
    );
  });

  test("refuse de changer le niveau requis en dessous du minimum du type déjà en base", async () => {
    jest.spyOn(service.sortieRepository, "findById").mockResolvedValue(
      buildSortie({ type: "Plongée technique", niveau_requis: "Niveau 3" }),
    );

    await expect(
      service.update(8, { niveau_requis: "Baptême" }),
    ).rejects.toThrow(/n'est pas compatible avec le type/);
  });

  test("accepte de changer type ET niveau requis ensemble vers une combinaison valide", async () => {
    jest.spyOn(service.sortieRepository, "findById").mockResolvedValue(buildSortie());
    // "type"/"niveau_requis" sont des champs notifiables (voir
    // CHAMPS_NOTIFIABLES_MODIFICATION) : la sortie restant "Planifiée",
    // update() tente de notifier les inscrits — mocké à vide ici, hors
    // sujet pour ce test (même précaution que le test de chevauchement
    // "laisse passer un changement qui ne crée aucun chevauchement" plus
    // haut).
    jest
      .spyOn(service.sortieRepository, "findByIdWithInscriptions")
      .mockResolvedValue({ inscriptions: [] });

    await expect(
      service.update(8, { type: "Baptême", niveau_requis: "Baptême" }),
    ).resolves.toMatchObject({ type: "Baptême", niveau_requis: "Baptême" });
  });

  // Même garde-fou que le chevauchement d'encadrant juste au-dessus : un
  // changement de statut seul (ni type ni niveau_requis dans le payload) ne
  // doit jamais revalider une combinaison déjà en place, même si celle-ci
  // était déjà incohérente avant ce garde-fou (données historiques).
  test("un changement de statut seul ignore une combinaison déjà incohérente en base", async () => {
    jest.spyOn(service.sortieRepository, "findById").mockResolvedValue(
      buildSortie({ type: "Baptême", niveau_requis: "Niveau 4" }),
    );

    await expect(
      service.update(8, { statut: "Terminée" }),
    ).resolves.toMatchObject({ statut: "Terminée" });
  });

  // Le formulaire d'édition (SortieForm.jsx) renvoie l'objet COMPLET à
  // chaque sauvegarde, type et niveau_requis inclus même non touchés — donc
  // présents (!== undefined) sur CHAQUE update(), pas seulement quand ils
  // changent réellement. Sans valeurChampModifiee (voir le garde-fou
  // ci-dessus), une sortie déjà incohérente en base deviendrait impossible à
  // corriger sur n'importe quel autre champ (ex. juste le lieu) tant que le
  // type/niveau n'est pas lui-même réparé en premier.
  test("un ré-envoi du même type/niveau requis (formulaire complet) n'importe pas s'ils sont déjà incohérents en base", async () => {
    jest.spyOn(service.sortieRepository, "findById").mockResolvedValue(
      buildSortie({ type: "Baptême", niveau_requis: "Niveau 4" }),
    );
    jest
      .spyOn(service.sortieRepository, "findByIdWithInscriptions")
      .mockResolvedValue({ inscriptions: [] });

    await expect(
      service.update(8, { type: "Baptême", niveau_requis: "Niveau 4", lieu: "Nouveau lieu" }),
    ).resolves.toMatchObject({ lieu: "Nouveau lieu" });
  });
});

describe("SortieService.update — notification de modification (sortie encore 'Planifiée')", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    // jest.restoreAllMocks() ci-dessus ne réinitialise que les spies créés
    // via jest.spyOn (sortieRepository...) — pas ces jest.fn() venant
    // directement des factories jest.mock() en haut de fichier, dont les
    // appels/implémentations enregistrés s'accumuleraient sinon d'un test
    // à l'autre (mock.calls jamais vidé par défaut, voir jest.config.js —
    // ni clearMocks ni resetMocks n'y sont activés).
    identiteClient.getAdherentById.mockReset();
    vieAssociativeClient.createAlerte.mockReset();
    sendSortieModifieeEmail.mockReset();
  });

  function mockSortie(overrides = {}) {
    return {
      id_sortie: 9,
      statut: "Planifiée",
      lieu: "Ancien lieu",
      site: "Ancien site",
      date_heure: "2026-10-01T08:00:00.000Z",
      duree_estimee: "02:00:00",
      type: "Plongée",
      niveau_requis: "Niveau 1",
      profondeur_max: 20,
      nb_places: 8,
      tarif_adherent: 15,
      update: jest.fn().mockImplementation(function (data) {
        Object.assign(this, data);
        return Promise.resolve(this);
      }),
      ...overrides,
    };
  }

  test("notifie chaque inscrit non annulé (email + notification) quand un champ de logistique change", async () => {
    jest.spyOn(service.sortieRepository, "findById").mockResolvedValue(mockSortie());
    jest.spyOn(service.sortieRepository, "findByIdWithInscriptions").mockResolvedValue({
      id_sortie: 9,
      inscriptions: [
        { id_inscription: 1, num_adherent: "A1", statut: "Confirmée" },
        { id_inscription: 2, num_adherent: "A2", statut: "En attente" },
        { id_inscription: 3, num_adherent: "A3", statut: "Annulée" },
      ],
    });
    identiteClient.getAdherentById.mockImplementation((num) =>
      Promise.resolve({ num_adherent: num, prenom: "Jean", nom: "Test", email: `${num}@test.fr` }),
    );
    vieAssociativeClient.createAlerte.mockResolvedValue();

    await service.update(9, { lieu: "Nouveau lieu" });

    // L'inscription "Annulée" (A3) n'est pas notifiée.
    expect(sendSortieModifieeEmail).toHaveBeenCalledTimes(2);
    expect(vieAssociativeClient.createAlerte).toHaveBeenCalledTimes(2);
    expect(vieAssociativeClient.createAlerte).toHaveBeenCalledWith(
      "A1",
      "Sortie modifiée",
      expect.objectContaining({ referenceType: "Sortie", referenceId: 9 }),
    );
    expect(sendSortieModifieeEmail).not.toHaveBeenCalledWith(
      expect.objectContaining({ to: "A3@test.fr" }),
    );
  });

  test("ne notifie personne si aucun champ de logistique n'a réellement changé", async () => {
    jest.spyOn(service.sortieRepository, "findById").mockResolvedValue(mockSortie());
    const findWithInscriptionsSpy = jest.spyOn(
      service.sortieRepository,
      "findByIdWithInscriptions",
    );

    // Même valeur que l'existant : aucun changement réel malgré le champ présent.
    await service.update(9, { lieu: "Ancien lieu" });

    expect(findWithInscriptionsSpy).not.toHaveBeenCalled();
    expect(sendSortieModifieeEmail).not.toHaveBeenCalled();
    expect(vieAssociativeClient.createAlerte).not.toHaveBeenCalled();
  });

  test("ne notifie pas quand la sortie sort du statut 'Planifiée' via cette même modification", async () => {
    jest.spyOn(service.sortieRepository, "findById").mockResolvedValue(mockSortie());
    const findWithInscriptionsSpy = jest.spyOn(
      service.sortieRepository,
      "findByIdWithInscriptions",
    );

    await service.update(9, { lieu: "Nouveau lieu", statut: "Annulée" });

    expect(findWithInscriptionsSpy).not.toHaveBeenCalled();
    expect(sendSortieModifieeEmail).not.toHaveBeenCalled();
  });

  test("n'envoie aucune notification si personne n'est inscrit", async () => {
    jest.spyOn(service.sortieRepository, "findById").mockResolvedValue(mockSortie());
    jest.spyOn(service.sortieRepository, "findByIdWithInscriptions").mockResolvedValue({
      id_sortie: 9,
      inscriptions: [],
    });

    await service.update(9, { lieu: "Nouveau lieu" });

    expect(sendSortieModifieeEmail).not.toHaveBeenCalled();
    expect(vieAssociativeClient.createAlerte).not.toHaveBeenCalled();
  });

  test("une erreur de notification pour un inscrit n'empêche pas la mise à jour ni les autres notifications", async () => {
    jest.spyOn(service.sortieRepository, "findById").mockResolvedValue(mockSortie());
    jest.spyOn(service.sortieRepository, "findByIdWithInscriptions").mockResolvedValue({
      id_sortie: 9,
      inscriptions: [
        { id_inscription: 1, num_adherent: "A1", statut: "Confirmée" },
        { id_inscription: 2, num_adherent: "A2", statut: "Confirmée" },
      ],
    });
    identiteClient.getAdherentById
      .mockRejectedValueOnce(new Error("identite-service indisponible"))
      .mockResolvedValueOnce({ num_adherent: "A2", prenom: "Jean", nom: "Test", email: "a2@test.fr" });
    jest.spyOn(console, "error").mockImplementation(() => {});

    const result = await service.update(9, { lieu: "Nouveau lieu" });

    expect(result.lieu).toBe("Nouveau lieu");
    expect(sendSortieModifieeEmail).toHaveBeenCalledTimes(1);
  });
});

describe("SortieService.getPropositionsReprogrammation / replanifier (reprogrammation après annulation météo)", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    // Même remarque que le describe "notification de modification" plus
    // haut : ces jest.fn() viennent des factories jest.mock() en haut de
    // fichier, pas réinitialisées par jest.restoreAllMocks().
    identiteClient.getAdherentById.mockReset();
    vieAssociativeClient.createAlerte.mockReset();
    sendSortieModifieeEmail.mockReset();
    sendReconfirmationInscriptionEmail.mockReset();
    getForecastForDate.mockReset();
  });

  const sortieAnnuleeMeteo = {
    id_sortie: 20,
    statut: "Annulée",
    motif_annulation: "Annulation automatique (météo défavorable) : Vent fort prévu (45 km/h).",
    latitude: -21.17,
    longitude: 55.28,
    date_heure: dansNJours(-2),
    duree_estimee: "02:00:00",
    site: "Saint-Leu",
    lieu: "Récif",
    inscriptions: [],
  };

  describe("getPropositionsReprogrammation", () => {
    test("lève si la sortie n'a pas été annulée pour cause météo (autre motif)", async () => {
      jest.spyOn(service.sortieRepository, "findById").mockResolvedValue({
        ...sortieAnnuleeMeteo,
        motif_annulation: "Manque d'encadrants disponibles.",
      });

      await expect(service.getPropositionsReprogrammation(20)).rejects.toThrow(
        /annulée pour cause météorologique/,
      );
    });

    test("lève si la sortie n'est pas (ou plus) Annulée", async () => {
      jest.spyOn(service.sortieRepository, "findById").mockResolvedValue({
        ...sortieAnnuleeMeteo,
        statut: "Planifiée",
      });

      await expect(service.getPropositionsReprogrammation(20)).rejects.toThrow(
        /annulée pour cause météorologique/,
      );
    });

    test("retourne jusqu'à PROPOSITIONS_MAX dates sans chevauchement, chacune enrichie de sa météo", async () => {
      jest.spyOn(service.sortieRepository, "findById").mockResolvedValue(sortieAnnuleeMeteo);
      jest.spyOn(service.sortieRepository, "findAutresPourChevauchement").mockResolvedValue([]);
      getForecastForDate.mockResolvedValue({ windspeed: 10 });

      const result = await service.getPropositionsReprogrammation(20);

      expect(result).toHaveLength(3);
      result.forEach((proposition) => {
        expect(new Date(proposition.date_heure).getTime()).toBeGreaterThan(
          new Date(sortieAnnuleeMeteo.date_heure).getTime(),
        );
        expect(proposition.meteo).toEqual({
          dangereux: false,
          motifs: [],
          forecast: { windspeed: 10 },
        });
      });
    });

    test("meteo: null pour une date trop éloignée pour être prévisible", async () => {
      jest.spyOn(service.sortieRepository, "findById").mockResolvedValue(sortieAnnuleeMeteo);
      jest.spyOn(service.sortieRepository, "findAutresPourChevauchement").mockResolvedValue([]);
      getForecastForDate.mockResolvedValue(null);

      const result = await service.getPropositionsReprogrammation(20);

      expect(result[0].meteo).toBeNull();
    });

    test("liste vide si tous les créneaux de la fenêtre chevauchent une autre sortie", async () => {
      jest.spyOn(service.sortieRepository, "findById").mockResolvedValue(sortieAnnuleeMeteo);
      // Une sortie de 24h chaque jour de la fenêtre bloque tout candidat,
      // quelle que soit l'heure testée.
      const autres = Array.from({ length: 25 }, (_, i) => {
        const d = new Date(sortieAnnuleeMeteo.date_heure);
        d.setDate(d.getDate() + i);
        return { id_sortie: 900 + i, date_heure: d, duree_estimee: "24:00:00" };
      });
      jest.spyOn(service.sortieRepository, "findAutresPourChevauchement").mockResolvedValue(autres);

      const result = await service.getPropositionsReprogrammation(20);

      expect(result).toEqual([]);
      expect(getForecastForDate).not.toHaveBeenCalled();
    });
  });

  describe("replanifier", () => {
    test("lève si la sortie n'a pas été annulée pour cause météo", async () => {
      jest.spyOn(service.sortieRepository, "findByIdWithInscriptions").mockResolvedValue({
        ...sortieAnnuleeMeteo,
        motif_annulation: "Manque d'encadrants disponibles.",
      });

      await expect(
        service.replanifier(20, { date_heure: dansNJours(10) }),
      ).rejects.toThrow(/annulée pour cause météorologique/);
    });

    test("lève si aucune date n'est fournie", async () => {
      jest.spyOn(service.sortieRepository, "findByIdWithInscriptions").mockResolvedValue(sortieAnnuleeMeteo);

      await expect(service.replanifier(20, {})).rejects.toThrow(/date est requise/);
    });

    test("lève si la date fournie est passée", async () => {
      jest.spyOn(service.sortieRepository, "findByIdWithInscriptions").mockResolvedValue(sortieAnnuleeMeteo);

      await expect(
        service.replanifier(20, { date_heure: dansNJours(-1) }),
      ).rejects.toThrow(/date future valide/);
    });

    test("lève si la date choisie chevauche une autre sortie déjà planifiée", async () => {
      jest.spyOn(service.sortieRepository, "findByIdWithInscriptions").mockResolvedValue(sortieAnnuleeMeteo);
      const nouvelleDate = dansNJours(10);
      jest.spyOn(service.sortieRepository, "findAutresPourChevauchement").mockResolvedValue([
        { id_sortie: 99, date_heure: nouvelleDate, duree_estimee: "02:00:00" },
      ]);

      await expect(
        service.replanifier(20, { date_heure: nouvelleDate }),
      ).rejects.toThrow(/chevauche/);
    });

    test("succès : remet 'Planifiée' à la nouvelle date, réinitialise le cycle météo, remet En attente les Confirmée", async () => {
      const sortie = {
        ...sortieAnnuleeMeteo,
        // A1 était Confirmée (reçoit la reconfirmation), A2 était déjà En
        // attente (reçoit la notification générique, statut inchangé), A3
        // était Annulée (jamais notifiée).
        inscriptions: [
          { id_inscription: 1, num_adherent: "A1", statut: "Confirmée" },
          { id_inscription: 2, num_adherent: "A2", statut: "En attente" },
          { id_inscription: 3, num_adherent: "A3", statut: "Annulée" },
        ],
      };
      jest.spyOn(service.sortieRepository, "findByIdWithInscriptions").mockResolvedValue(sortie);
      jest.spyOn(service.sortieRepository, "findAutresPourChevauchement").mockResolvedValue([]);
      jest.spyOn(service.sortieRepository, "update").mockResolvedValue({});
      jest.spyOn(service.sortieRepository, "findById").mockResolvedValue({ ...sortie, statut: "Planifiée" });
      const remettreEnAttenteSpy = jest
        .spyOn(service.inscriptionRepository, "remettreEnAttenteConfirmeesBySortie")
        .mockResolvedValue(1);
      identiteClient.getAdherentById.mockImplementation((num) =>
        Promise.resolve({ num_adherent: num, prenom: "Jean", nom: "Test", email: `${num}@test.fr` }),
      );

      const nouvelleDate = dansNJours(10);
      const result = await service.replanifier(20, { date_heure: nouvelleDate });

      expect(service.sortieRepository.update).toHaveBeenCalledWith(20, {
        statut: "Planifiée",
        date_heure: new Date(nouvelleDate),
        motif_annulation: null,
        meteo_test_j5_fait: false,
        meteo_test_j4_fait: false,
        meteo_test_j3_fait: false,
        meteo_motifs_detectes: null,
        meteo_alerte_j1_envoyee: false,
      });
      expect(remettreEnAttenteSpy).toHaveBeenCalledWith(20);

      // A1 (était Confirmée) : email de reconfirmation + alerte pointant
      // vers l'inscription.
      expect(sendReconfirmationInscriptionEmail).toHaveBeenCalledTimes(1);
      expect(sendReconfirmationInscriptionEmail).toHaveBeenCalledWith(
        expect.objectContaining({ to: "A1@test.fr", id_inscription: 1 }),
      );
      expect(vieAssociativeClient.createAlerte).toHaveBeenCalledWith(
        "A1",
        "Sortie modifiée",
        expect.objectContaining({ referenceType: "Inscription", referenceId: 1 }),
      );

      // A2 (était déjà En attente) : simple notification "sortie modifiée",
      // pas de reconfirmation à faire (son statut n'a pas changé).
      expect(sendSortieModifieeEmail).toHaveBeenCalledTimes(1);
      expect(sendSortieModifieeEmail).toHaveBeenCalledWith(
        expect.objectContaining({ to: "A2@test.fr", champsModifies: ["Date et heure"] }),
      );
      expect(vieAssociativeClient.createAlerte).toHaveBeenCalledWith(
        "A2",
        "Sortie modifiée",
        expect.objectContaining({ referenceType: "Sortie", referenceId: 20 }),
      );

      // A3 (Annulée) n'est jamais notifiée.
      expect(identiteClient.getAdherentById).not.toHaveBeenCalledWith("A3", expect.anything());

      expect(result.statut).toBe("Planifiée");
    });

    test("une erreur de notification pour un inscrit n'empêche pas la mise à jour", async () => {
      const sortie = {
        ...sortieAnnuleeMeteo,
        inscriptions: [{ id_inscription: 1, num_adherent: "A1", statut: "Confirmée" }],
      };
      jest.spyOn(service.sortieRepository, "findByIdWithInscriptions").mockResolvedValue(sortie);
      jest.spyOn(service.sortieRepository, "findAutresPourChevauchement").mockResolvedValue([]);
      jest.spyOn(service.sortieRepository, "update").mockResolvedValue({});
      jest.spyOn(service.sortieRepository, "findById").mockResolvedValue({ ...sortie, statut: "Planifiée" });
      jest.spyOn(service.inscriptionRepository, "remettreEnAttenteConfirmeesBySortie").mockResolvedValue(1);
      identiteClient.getAdherentById.mockRejectedValue(new Error("identite-service indisponible"));
      jest.spyOn(console, "error").mockImplementation(() => {});

      const result = await service.replanifier(20, { date_heure: dansNJours(10) });

      expect(result.statut).toBe("Planifiée");
      expect(sendReconfirmationInscriptionEmail).not.toHaveBeenCalled();
      expect(sendSortieModifieeEmail).not.toHaveBeenCalled();
    });

    test("un échec de remettreEnAttenteConfirmeesInscriptions (best-effort) n'empêche pas la replanification", async () => {
      const sortie = { ...sortieAnnuleeMeteo, inscriptions: [] };
      jest.spyOn(service.sortieRepository, "findByIdWithInscriptions").mockResolvedValue(sortie);
      jest.spyOn(service.sortieRepository, "findAutresPourChevauchement").mockResolvedValue([]);
      jest.spyOn(service.sortieRepository, "update").mockResolvedValue({});
      jest.spyOn(service.sortieRepository, "findById").mockResolvedValue({ ...sortie, statut: "Planifiée" });
      jest
        .spyOn(service.inscriptionRepository, "remettreEnAttenteConfirmeesBySortie")
        .mockRejectedValue(new Error("DB indisponible"));
      jest.spyOn(console, "error").mockImplementation(() => {});

      const result = await service.replanifier(20, { date_heure: dansNJours(10) });

      expect(result.statut).toBe("Planifiée");
    });
  });
});

// Régression sécurité : les routes de pointage (POST/PUT/DELETE .../pointage,
// sortieRoutes.js) n'étaient gardées que par le rôle générique (authenticate
// + authorize(PRESIDENT_MONITEUR)) — n'importe quel moniteur du club pouvait
// pointer présent/absent sur une sortie confiée à un autre. Même garde-fou
// que InscriptionService.assertCanManageInscription / le reste de
// SortieService (replanifier, annulerPourMeteo...) : assertCanManageSortie
// doit maintenant être appelé avant toute écriture de pointage.
describe("SortieService — pointage réservé à l'encadrant désigné", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    identiteClient.getMoniteurByUserId.mockReset();
  });

  const sortieEncadreeParM1 = {
    id_sortie: 30,
    statut: "Planifiée",
    date_heure: new Date().toISOString(),
    encadrants: [10],
  };
  const president = { id: 1, role: "president" };
  const moniteurNonEncadrant = { id: 2, role: "moniteur" };
  const moniteurEncadrant = { id: 3, role: "moniteur" };

  describe("enregistrerPointage", () => {
    test("un moniteur NON désigné encadrant de la sortie est refusé", async () => {
      jest.spyOn(service.sortieRepository, "findById").mockResolvedValue(sortieEncadreeParM1);
      identiteClient.getMoniteurByUserId.mockResolvedValue({ id_moniteur: 99 });

      await expect(
        service.enregistrerPointage(30, [], 2, null, moniteurNonEncadrant),
      ).rejects.toThrow(/encadrant désigné/);
    });

    test("le président peut pointer sans résoudre de moniteur", async () => {
      jest.spyOn(service.sortieRepository, "findById").mockResolvedValue(sortieEncadreeParM1);
      jest.spyOn(service.inscriptionRepository, "findById").mockResolvedValue(null);

      await expect(
        service.enregistrerPointage(30, [], 1, null, president),
      ).resolves.toEqual([]);
      expect(identiteClient.getMoniteurByUserId).not.toHaveBeenCalled();
    });

    test("le moniteur désigné encadrant de la sortie peut pointer", async () => {
      jest.spyOn(service.sortieRepository, "findById").mockResolvedValue(sortieEncadreeParM1);
      jest.spyOn(service.inscriptionRepository, "findById").mockResolvedValue(null);
      identiteClient.getMoniteurByUserId.mockResolvedValue({ id_moniteur: 10 });

      await expect(
        service.enregistrerPointage(30, [], 3, null, moniteurEncadrant),
      ).resolves.toEqual([]);
    });
  });

  describe("modifierPointage / annulerPointage", () => {
    const inscriptionSurCetteSortie = {
      id_inscription: 40,
      id_sortie: 30,
      presence_checked: true,
    };

    test("modifierPointage refuse un moniteur non désigné encadrant", async () => {
      jest.spyOn(service.inscriptionRepository, "findById").mockResolvedValue(inscriptionSurCetteSortie);
      jest.spyOn(service.sortieRepository, "findById").mockResolvedValue(sortieEncadreeParM1);
      identiteClient.getMoniteurByUserId.mockResolvedValue({ id_moniteur: 99 });

      await expect(
        service.modifierPointage(40, { presence: true }, 2, moniteurNonEncadrant),
      ).rejects.toThrow(/encadrant désigné/);
    });

    test("annulerPointage refuse un moniteur non désigné encadrant", async () => {
      jest.spyOn(service.inscriptionRepository, "findById").mockResolvedValue(inscriptionSurCetteSortie);
      jest.spyOn(service.sortieRepository, "findById").mockResolvedValue(sortieEncadreeParM1);
      identiteClient.getMoniteurByUserId.mockResolvedValue({ id_moniteur: 99 });

      await expect(
        service.annulerPointage(40, 2, moniteurNonEncadrant),
      ).rejects.toThrow(/encadrant désigné/);
    });

    test("annulerPointage autorise le moniteur désigné encadrant", async () => {
      jest.spyOn(service.inscriptionRepository, "findById").mockResolvedValue(inscriptionSurCetteSortie);
      jest.spyOn(service.sortieRepository, "findById").mockResolvedValue(sortieEncadreeParM1);
      jest.spyOn(service.inscriptionRepository, "update").mockResolvedValue({ id_inscription: 40 });
      identiteClient.getMoniteurByUserId.mockResolvedValue({ id_moniteur: 10 });

      await expect(service.annulerPointage(40, 3, moniteurEncadrant)).resolves.toEqual({
        id_inscription: 40,
      });
    });
  });
});

// Photos d'une sortie (déplacées depuis Plongee.lien_photos, un lien unique
// par plongée individuelle, vers un tableau partagé par toute la sortie,
// visible seulement de ses participants — voir SortieService
// .assertCanAccessPhotos/addPhotos/removePhoto).
describe("SortieService — photos de sortie, réservées aux participants", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    identiteClient.getMoniteurByUserId.mockReset();
    identiteClient.getAdherentForUser.mockReset();
  });

  const sortiePhotos = {
    id_sortie: 50,
    encadrants: [10],
    photos: [
      {
        id: "photo-1",
        url: "https://exemple.test/photo1.jpg",
        ajoute_par_user_id: 7,
        ajoute_par_nom: "Camille Payet",
        date_ajout: "2026-01-01T00:00:00.000Z",
      },
    ],
  };
  const president = { id: 1, role: "president" };
  const moniteurEncadrant = { id: 3, role: "moniteur" };
  const moniteurNonEncadrant = { id: 2, role: "moniteur" };
  const adherentConfirme = { id: 7, role: "adherent" };
  const adherentNonConfirme = { id: 8, role: "adherent" };
  const adherentNonInscrit = { id: 9, role: "adherent" };

  describe("getPhotos", () => {
    test("le président voit toujours les photos", async () => {
      jest.spyOn(service.sortieRepository, "findById").mockResolvedValue(sortiePhotos);
      await expect(service.getPhotos(50, president)).resolves.toEqual(sortiePhotos.photos);
    });

    test("le moniteur désigné encadrant voit les photos", async () => {
      jest.spyOn(service.sortieRepository, "findById").mockResolvedValue(sortiePhotos);
      identiteClient.getMoniteurByUserId.mockResolvedValue({ id_moniteur: 10 });
      await expect(service.getPhotos(50, moniteurEncadrant)).resolves.toEqual(sortiePhotos.photos);
    });

    test("un moniteur NON désigné encadrant, sans inscription, est refusé", async () => {
      jest.spyOn(service.sortieRepository, "findById").mockResolvedValue(sortiePhotos);
      identiteClient.getMoniteurByUserId.mockResolvedValue({ id_moniteur: 99 });
      await expect(service.getPhotos(50, moniteurNonEncadrant)).rejects.toThrow(
        /participants de cette sortie/,
      );
    });

    test("un adhérent avec une inscription Confirmée voit les photos", async () => {
      jest.spyOn(service.sortieRepository, "findById").mockResolvedValue(sortiePhotos);
      identiteClient.getAdherentForUser.mockResolvedValue({ num_adherent: "A1" });
      jest
        .spyOn(service.inscriptionRepository, "findByAdherentAndSortie")
        .mockResolvedValue({ statut: "Confirmée" });
      await expect(service.getPhotos(50, adherentConfirme)).resolves.toEqual(sortiePhotos.photos);
    });

    test("un adhérent avec une inscription pas encore Confirmée est refusé", async () => {
      jest.spyOn(service.sortieRepository, "findById").mockResolvedValue(sortiePhotos);
      identiteClient.getAdherentForUser.mockResolvedValue({ num_adherent: "A2" });
      jest
        .spyOn(service.inscriptionRepository, "findByAdherentAndSortie")
        .mockResolvedValue({ statut: "En attente" });
      await expect(service.getPhotos(50, adherentNonConfirme)).rejects.toThrow(
        /participants de cette sortie/,
      );
    });

    test("un adhérent sans inscription à cette sortie est refusé", async () => {
      jest.spyOn(service.sortieRepository, "findById").mockResolvedValue(sortiePhotos);
      identiteClient.getAdherentForUser.mockResolvedValue({ num_adherent: "A3" });
      jest
        .spyOn(service.inscriptionRepository, "findByAdherentAndSortie")
        .mockResolvedValue(null);
      await expect(service.getPhotos(50, adherentNonInscrit)).rejects.toThrow(
        /participants de cette sortie/,
      );
    });
  });

  describe("addPhotos", () => {
    test("ajoute plusieurs liens en un seul appel, tagués avec l'auteur", async () => {
      jest.spyOn(service.sortieRepository, "findById").mockResolvedValue({
        id_sortie: 50,
        encadrants: [],
        photos: [],
      });
      const updateSpy = jest
        .spyOn(service.sortieRepository, "update")
        .mockResolvedValue({});

      const result = await service.addPhotos(
        50,
        ["https://exemple.test/a.jpg", "https://exemple.test/b.jpg"],
        president,
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        url: "https://exemple.test/a.jpg",
        ajoute_par_user_id: president.id,
      });
      expect(updateSpy).toHaveBeenCalledWith(50, { photos: result });
    });

    test("ignore les lignes vides et rejette s'il ne reste aucun lien valide", async () => {
      jest.spyOn(service.sortieRepository, "findById").mockResolvedValue({
        id_sortie: 50,
        encadrants: [],
        photos: [],
      });

      await expect(service.addPhotos(50, ["", "   "], president)).rejects.toThrow(
        "Au moins un lien photo est requis",
      );
    });

    test("refuse l'ajout à qui ne peut pas accéder aux photos", async () => {
      jest.spyOn(service.sortieRepository, "findById").mockResolvedValue(sortiePhotos);
      identiteClient.getAdherentForUser.mockResolvedValue(null);

      await expect(
        service.addPhotos(50, ["https://exemple.test/c.jpg"], adherentNonInscrit),
      ).rejects.toThrow(/participants de cette sortie/);
    });
  });

  describe("removePhoto", () => {
    test("l'auteur peut retirer sa propre photo sans être président/encadrant", async () => {
      jest.spyOn(service.sortieRepository, "findById").mockResolvedValue(sortiePhotos);
      identiteClient.getAdherentForUser.mockResolvedValue({ num_adherent: "A1" });
      jest
        .spyOn(service.inscriptionRepository, "findByAdherentAndSortie")
        .mockResolvedValue({ statut: "Confirmée" });
      const updateSpy = jest
        .spyOn(service.sortieRepository, "update")
        .mockResolvedValue({});

      const result = await service.removePhoto(50, "photo-1", adherentConfirme);

      expect(result).toEqual([]);
      expect(updateSpy).toHaveBeenCalledWith(50, { photos: [] });
    });

    test("un participant non-auteur ne peut pas retirer la photo d'un autre", async () => {
      const autreParticipant = { id: 77, role: "adherent" };
      jest.spyOn(service.sortieRepository, "findById").mockResolvedValue(sortiePhotos);
      identiteClient.getAdherentForUser.mockResolvedValue({ num_adherent: "A9" });
      jest
        .spyOn(service.inscriptionRepository, "findByAdherentAndSortie")
        .mockResolvedValue({ statut: "Confirmée" });

      await expect(
        service.removePhoto(50, "photo-1", autreParticipant),
      ).rejects.toThrow(/gérer cette sortie/);
    });

    test("le président peut retirer la photo de n'importe qui (modération)", async () => {
      jest.spyOn(service.sortieRepository, "findById").mockResolvedValue(sortiePhotos);
      const updateSpy = jest
        .spyOn(service.sortieRepository, "update")
        .mockResolvedValue({});

      const result = await service.removePhoto(50, "photo-1", president);

      expect(result).toEqual([]);
      expect(updateSpy).toHaveBeenCalledWith(50, { photos: [] });
    });

    test("rejette un id de photo introuvable", async () => {
      jest.spyOn(service.sortieRepository, "findById").mockResolvedValue(sortiePhotos);

      await expect(
        service.removePhoto(50, "photo-inconnue", president),
      ).rejects.toThrow("Photo non trouvée");
    });
  });
});
