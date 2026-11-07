import { beforeEach, afterEach, expect, it, vi } from "vitest";

beforeEach(() => vi.resetModules());
afterEach(() => vi.restoreAllMocks());

it("sends cookies and CSRF headers without reading a legacy authentication token", async () => {
  const { default: axios } = await import("axios");
  vi.spyOn(axios, "get").mockResolvedValue({ data: { data: { csrfToken: "csrf-initial" } } });
  const { default: api } = await import("./api");
  localStorage.setItem("token", "legacy-secret");
  const requests = [];
  api.defaults.adapter = async (config) => {
    requests.push(config);
    return { config, status: 200, headers: {}, data: { data: { csrfToken: "csrf-rotated" } } };
  };
  await api.post("/auth/login", { email: "test@example.com", password: "test" });
  await api.post("/sorties", {});
  expect(requests[0].withCredentials).toBe(true);
  expect(requests[0].headers["X-Auth-Transport"]).toBe("cookie");
  expect(requests[0].headers.Authorization).toBeUndefined();
  expect(requests[0].headers["X-CSRF-Token"]).toBe("csrf-initial");
  expect(requests[1].headers["X-CSRF-Token"]).toBe("csrf-rotated");
  localStorage.removeItem("token");
});

it("refreshes a stale CSRF proof once before retrying a rejected write", async () => {
  const { default: axios } = await import("axios");
  const bootstrap = vi.spyOn(axios, "get")
    .mockResolvedValueOnce({ data: { data: { csrfToken: "stale" } } })
    .mockResolvedValueOnce({ data: { data: { csrfToken: "current" } } });
  const { default: api } = await import("./api");
  const proofs = [];
  api.defaults.adapter = async (config) => {
    proofs.push(config.headers["X-CSRF-Token"]);
    if (proofs.length === 1) throw { config, response: { status: 403, data: { code: "CSRF_INVALID" } } };
    return { config, status: 200, headers: {}, data: { success: true } };
  };
  await api.post("/sorties", {});
  expect(proofs).toEqual(["stale", "current"]);
  expect(bootstrap).toHaveBeenCalledTimes(2);
});

it("does not retry a failed business write or an authorization rejection", async () => {
  const { default: axios } = await import("axios");
  vi.spyOn(axios, "get").mockResolvedValue({ data: { data: { csrfToken: "csrf" } } });
  const { default: api } = await import("./api");
  const adapter = vi.fn(async (config) => { throw { config, response: { status: 403, data: { message: "Accès refusé" } } }; });
  api.defaults.adapter = adapter;
  await expect(api.post("/sorties", {})).rejects.toMatchObject({ response: { status: 403 } });
  expect(adapter).toHaveBeenCalledTimes(1);
});
