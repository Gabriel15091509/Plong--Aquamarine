jest.mock("../../src/utils/meteoClient", () => ({
  getForecastForDate: jest.fn(),
  evaluerDanger: jest.requireActual("../../src/utils/meteoClient").evaluerDanger,
}));
jest.mock("../../src/utils/serviceClients/identiteClient", () => ({
  getAdherentById: jest.fn(),
  getUserBasicById: jest.fn(),
  getMoniteurById: jest.fn(),
}));
jest.mock("../../src/utils/email", () => ({
  sendSortieAnnuleeMeteoEmail: jest.fn(),
  sendPropositionsReprogrammationEmail: jest.fn(),
  sendAlerteMeteoDouteuseEmail: jest.fn(),
  sendSortieSansInscriptionEmail: jest.fn(),
}));

const SortieService = require("../../src/services/SortieService");
const { getForecastForDate } = require("../../src/utils/meteoClient");
const identiteClient = require("../../src/utils/serviceClients/identiteClient");
const {
  sendSortieAnnuleeMeteoEmail,
  sendAlerteMeteoDouteuseEmail,
  sendSortieSansInscriptionEmail,
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

describe("SortieService.demarrerSortiesEchues", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("délègue au repository et renvoie le nombre de sorties démarrées", async () => {
    const repoSpy = jest
      .spyOn(service.sortieRepository, "demarrerSortiesEchues")
      .mockResolvedValue(3);

    const result = await service.demarrerSortiesEchues();

    expect(repoSpy).toHaveBeenCalled();
    expect(result).toBe(3);
  });
});
