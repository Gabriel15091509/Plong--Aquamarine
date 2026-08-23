const { getForecastForDate, evaluerDanger } = require("../../src/utils/meteoClient");

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  jest.restoreAllMocks();
});

function mockFetchSequence(responses) {
  let call = 0;
  global.fetch = jest.fn(() => {
    const response = responses[call] ?? responses[responses.length - 1];
    call += 1;
    return Promise.resolve(response);
  });
}

const okJson = (body) => ({ ok: true, status: 200, json: async () => body });

// Dates calculées par rapport à "aujourd'hui" (même logique locale à minuit
// que meteoClient.joursDepuisAujourdhui) plutôt que codées en dur : un jour
// calendaire fixe finit toujours par glisser dans le passé au fil des runs
// CI, ce qui a déjà rendu ce test faussement rouge (cf. le même problème
// déjà rencontré et corrigé sur le test joursRestants).
function dateStr(daysFromNow) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + daysFromNow);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

describe("meteoClient.getForecastForDate", () => {
  test("extrait les valeurs du bon jour dans les tableaux daily.time", async () => {
    const veille = dateStr(0);
    const jourCible = dateStr(1);
    mockFetchSequence([
      okJson({
        daily: {
          time: [veille, jourCible],
          weathercode: [1, 95],
          windspeed_10m_max: [15, 42],
          windgusts_10m_max: [20, 60],
          precipitation_sum: [0, 10],
        },
      }),
      okJson({
        daily: { time: [veille, jourCible], wave_height_max: [0.8, 2.5] },
      }),
    ]);

    const forecast = await getForecastForDate({
      latitude: -21.17,
      longitude: 55.28,
      date: `${jourCible}T08:00:00.000Z`,
    });

    expect(forecast).toEqual({
      date: jourCible,
      windspeed: 42,
      windgusts: 60,
      weathercode: 95,
      precipitation: 10,
      waveHeight: 2.5,
    });
  });

  test("renvoie null si la date est hors des deux fenêtres de prévision", async () => {
    const veille = dateStr(0);
    const horsFenetre = dateStr(30); // > 16 jours dans le futur

    mockFetchSequence([
      okJson({ daily: { time: [veille], weathercode: [1], windspeed_10m_max: [15] } }),
      okJson({ daily: { time: [veille], wave_height_max: [0.8] } }),
    ]);

    const forecast = await getForecastForDate({
      latitude: -21.17,
      longitude: 55.28,
      date: `${horsFenetre}T08:00:00.000Z`,
    });

    expect(forecast).toBeNull();
  });

  test("reste utilisable si la Marine API échoue (best-effort, non bloquant)", async () => {
    const jourCible = dateStr(1);
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        okJson({
          daily: {
            time: [jourCible],
            weathercode: [1],
            windspeed_10m_max: [15],
            windgusts_10m_max: [20],
            precipitation_sum: [0],
          },
        }),
      )
      .mockRejectedValueOnce(new Error("marine api down"));

    const forecast = await getForecastForDate({
      latitude: -21.17,
      longitude: 55.28,
      date: `${jourCible}T08:00:00.000Z`,
    });

    expect(forecast).toMatchObject({ windspeed: 15, waveHeight: null });
  });

  // Date système fixée à 2026-08-18 (voir currentDate de session) : une
  // sortie du 2026-08-10 est passée depuis 8 jours, dans la fenêtre
  // `past_days` (<=92 jours) de l'API forecast — relevé observé, pas une
  // prévision.
  test("sortie passée récente (<=92j) : relevé observé via past_days, historique=true", async () => {
    mockFetchSequence([
      okJson({
        daily: {
          time: ["2026-08-10"],
          weathercode: [3],
          windspeed_10m_max: [25],
          windgusts_10m_max: [35],
          precipitation_sum: [2],
        },
      }),
      okJson({ daily: { time: ["2026-08-10"], wave_height_max: [1.2] } }),
    ]);

    const forecast = await getForecastForDate({
      latitude: -21.17,
      longitude: 55.28,
      date: "2026-08-10T08:00:00.000Z",
    });

    expect(forecast).toEqual({
      date: "2026-08-10",
      windspeed: 25,
      windgusts: 35,
      weathercode: 3,
      precipitation: 2,
      waveHeight: 1.2,
      historique: true,
    });
  });

  test("sortie très ancienne (>92j) : bascule sur l'archive historique, sans houle", async () => {
    mockFetchSequence([
      okJson({
        daily: {
          time: ["2025-01-01"],
          weathercode: [2],
          windspeed_10m_max: [18],
          windgusts_10m_max: [22],
          precipitation_sum: [1],
        },
      }),
    ]);

    const forecast = await getForecastForDate({
      latitude: -21.17,
      longitude: 55.28,
      date: "2025-01-01T08:00:00.000Z",
    });

    expect(forecast).toEqual({
      date: "2025-01-01",
      windspeed: 18,
      windgusts: 22,
      weathercode: 2,
      precipitation: 1,
      waveHeight: null,
      historique: true,
    });
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch.mock.calls[0][0]).toContain("archive-api.open-meteo.com");
  });
});

describe("meteoClient.evaluerDanger", () => {
  test("aucune prévision (null) : jamais dangereux", () => {
    expect(evaluerDanger(null)).toEqual({ dangereux: false, motifs: [] });
  });

  test("conditions calmes : pas dangereux", () => {
    const result = evaluerDanger({
      windspeed: 10,
      windgusts: 15,
      weathercode: 1,
      precipitation: 0,
      waveHeight: 0.5,
    });
    expect(result).toEqual({ dangereux: false, motifs: [] });
  });

  test("vent fort déclenche un motif", () => {
    const result = evaluerDanger({
      windspeed: 40,
      windgusts: null,
      weathercode: null,
      precipitation: null,
      waveHeight: null,
    });
    expect(result.dangereux).toBe(true);
    expect(result.motifs[0]).toMatch(/Vent fort/);
  });

  test("houle importante déclenche un motif", () => {
    const result = evaluerDanger({
      windspeed: null,
      windgusts: null,
      weathercode: null,
      precipitation: null,
      waveHeight: 2.4,
    });
    expect(result.dangereux).toBe(true);
    expect(result.motifs[0]).toMatch(/Houle importante/);
  });

  test("code météo orage (95/96/99) déclenche un motif", () => {
    for (const code of [95, 96, 99]) {
      const result = evaluerDanger({
        windspeed: null,
        windgusts: null,
        weathercode: code,
        precipitation: null,
        waveHeight: null,
      });
      expect(result.dangereux).toBe(true);
      expect(result.motifs).toContain("Orage prévu");
    }
  });

  test("relevé historique : motifs au passé (observé), pas au futur (prévu)", () => {
    const result = evaluerDanger({
      windspeed: 40,
      windgusts: 70,
      weathercode: 99,
      precipitation: 40,
      waveHeight: 3,
      historique: true,
    });
    expect(result.dangereux).toBe(true);
    expect(result.motifs.join(" ")).not.toMatch(/prévu|prévue|prévues/);
    expect(result.motifs).toContain("Orage observé");
  });

  test("cumule plusieurs motifs simultanés", () => {
    const result = evaluerDanger({
      windspeed: 50,
      windgusts: 70,
      weathercode: 99,
      precipitation: 40,
      waveHeight: 3,
    });
    expect(result.dangereux).toBe(true);
    expect(result.motifs).toHaveLength(5);
  });
});
