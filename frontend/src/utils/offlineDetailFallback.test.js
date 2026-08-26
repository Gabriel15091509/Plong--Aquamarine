import { describe, it, expect, vi } from "vitest";
import { getByIdWithOfflineFallback } from "./offlineDetailFallback";

const makeService = ({ getById, getAll }) => ({ getById, getAll });

describe("getByIdWithOfflineFallback", () => {
  it("retourne directement le résultat de getById quand il réussit", async () => {
    const service = makeService({
      getById: vi.fn().mockResolvedValue({ success: true, data: { id_sortie: 1 } }),
      getAll: vi.fn(),
    });

    const result = await getByIdWithOfflineFallback(service, 1, "id_sortie");

    expect(result).toEqual({ success: true, data: { id_sortie: 1 } });
    expect(service.getAll).not.toHaveBeenCalled();
  });

  it("retombe sur la liste en cache quand getById échoue sans réponse HTTP (hors-ligne)", async () => {
    const networkError = new Error("Failed to fetch"); // pas de .response
    const service = makeService({
      getById: vi.fn().mockRejectedValue(networkError),
      getAll: vi.fn().mockResolvedValue({
        success: true,
        data: [{ id_sortie: 1 }, { id_sortie: 2, lieu: "Saint-Leu" }],
      }),
    });

    const result = await getByIdWithOfflineFallback(service, 2, "id_sortie");

    expect(result).toEqual({ success: true, data: { id_sortie: 2, lieu: "Saint-Leu" } });
  });

  it("compare les identifiants en chaîne (id numérique vs id string dans l'URL)", async () => {
    const networkError = new Error("Failed to fetch");
    const service = makeService({
      getById: vi.fn().mockRejectedValue(networkError),
      getAll: vi.fn().mockResolvedValue({
        success: true,
        data: [{ num_adherent: "A123" }],
      }),
    });

    const result = await getByIdWithOfflineFallback(service, "A123", "num_adherent");

    expect(result.data.num_adherent).toBe("A123");
  });

  it("relance l'erreur d'origine si l'id ne se trouve pas dans la liste de secours", async () => {
    const networkError = new Error("Failed to fetch");
    const service = makeService({
      getById: vi.fn().mockRejectedValue(networkError),
      getAll: vi.fn().mockResolvedValue({ success: true, data: [{ id_sortie: 1 }] }),
    });

    await expect(getByIdWithOfflineFallback(service, 999, "id_sortie")).rejects.toBe(
      networkError,
    );
  });

  it("relance l'erreur d'origine si la liste de secours est elle-même indisponible", async () => {
    const networkError = new Error("Failed to fetch");
    const service = makeService({
      getById: vi.fn().mockRejectedValue(networkError),
      getAll: vi.fn().mockRejectedValue(new Error("liste aussi indisponible")),
    });

    await expect(getByIdWithOfflineFallback(service, 1, "id_sortie")).rejects.toBe(
      networkError,
    );
  });

  it("ne masque jamais une vraie erreur HTTP (404, 403...) derrière le secours liste", async () => {
    const httpError = new Error("Not found");
    httpError.response = { status: 404, data: { message: "Introuvable" } };
    const service = makeService({
      getById: vi.fn().mockRejectedValue(httpError),
      getAll: vi.fn().mockResolvedValue({ success: true, data: [{ id_sortie: 1 }] }),
    });

    await expect(getByIdWithOfflineFallback(service, 1, "id_sortie")).rejects.toBe(httpError);
    expect(service.getAll).not.toHaveBeenCalled();
  });
});
