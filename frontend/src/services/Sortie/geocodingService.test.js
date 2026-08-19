import { describe, it, expect, vi, beforeEach } from "vitest";
import geocodingService from "./geocodingService";

const mockFetchOnce = (payload, ok = true) => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok,
    json: async () => payload,
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

describe("geocodingService.search", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("ne recherche pas en dessous de 3 caractères (évite un appel réseau inutile)", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const results = await geocodingService.search("St");
    expect(results).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("interroge Nominatim et convertit chaque résultat en {lieu, site, lat, lng, label}", async () => {
    const fetchMock = mockFetchOnce([
      {
        place_id: 42,
        lat: "-21.166457",
        lon: "55.28697",
        display_name: "Saint-Leu, La Réunion, France",
        name: "Port de Saint-Leu",
        address: { town: "Saint-Leu" },
      },
    ]);

    const results = await geocodingService.search("Saint-Leu");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calledUrl = fetchMock.mock.calls[0][0];
    expect(calledUrl).toContain("nominatim.openstreetmap.org/search");
    expect(calledUrl).toContain("q=Saint-Leu");

    expect(results).toEqual([
      {
        id: 42,
        lat: -21.166457,
        lng: 55.28697,
        label: "Saint-Leu, La Réunion, France",
        lieu: "Saint-Leu",
        site: "Port de Saint-Leu",
      },
    ]);
  });

  it("propage une erreur explicite si Nominatim répond en échec", async () => {
    mockFetchOnce({}, false);
    await expect(geocodingService.search("Saint-Leu")).rejects.toThrow(
      "Nominatim request failed",
    );
  });
});

describe("geocodingService.reverseGeocode", () => {
  it("dérive lieu/site à partir de l'adresse retournée par Nominatim", async () => {
    mockFetchOnce({
      name: "Tour de Boucan",
      address: { town: "Saint-Leu" },
    });

    const result = await geocodingService.reverseGeocode(-21.16, 55.28);

    expect(result).toEqual({ lieu: "Saint-Leu", site: "Tour de Boucan" });
  });
});
