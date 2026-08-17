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

describe("meteoClient.getForecastForDate", () => {
  test("extrait les valeurs du bon jour dans les tableaux daily.time", async () => {
    mockFetchSequence([
      okJson({
        daily: {
          time: ["2026-08-20", "2026-08-21"],
          weathercode: [1, 95],
          windspeed_10m_max: [15, 42],
          windgusts_10m_max: [20, 60],
          precipitation_sum: [0, 10],
        },
      }),
      okJson({
        daily: { time: ["2026-08-20", "2026-08-21"], wave_height_max: [0.8, 2.5] },
      }),
    ]);

    const forecast = await getForecastForDate({
      latitude: -21.17,
      longitude: 55.28,
      date: "2026-08-21T08:00:00.000Z",
    });

    expect(forecast).toEqual({
      date: "2026-08-21",
      windspeed: 42,
      windgusts: 60,
      weathercode: 95,
      precipitation: 10,
      waveHeight: 2.5,
    });
  });

  test("renvoie null si la date est hors des deux fenêtres de prévision", async () => {
    mockFetchSequence([
      okJson({ daily: { time: ["2026-08-20"], weathercode: [1], windspeed_10m_max: [15] } }),
      okJson({ daily: { time: ["2026-08-20"], wave_height_max: [0.8] } }),
    ]);

    const forecast = await getForecastForDate({
      latitude: -21.17,
      longitude: 55.28,
      date: "2027-01-01T08:00:00.000Z",
    });

    expect(forecast).toBeNull();
  });

  test("reste utilisable si la Marine API échoue (best-effort, non bloquant)", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        okJson({
          daily: {
            time: ["2026-08-21"],
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
      date: "2026-08-21T08:00:00.000Z",
    });

    expect(forecast).toMatchObject({ windspeed: 15, waveHeight: null });
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
