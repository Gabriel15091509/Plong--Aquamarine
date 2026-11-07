const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const request = require("supertest");
const { corsOptions, securityHeaders, helmetOptions } = require("../../shared/securityPolicy");
const { serviceFetch, getSystemAuthHeader, isInternalRequest } = require("../../shared/serviceAuth");
const { validateRemoteSession } = require("../../shared/sessionValidation");

const previous = { NODE_ENV: process.env.NODE_ENV, CORS_ORIGIN: process.env.CORS_ORIGIN, FRONTEND_URL: process.env.FRONTEND_URL };
beforeEach(() => {
  process.env.NODE_ENV = "production";
  process.env.CORS_ORIGIN = "https://club.example";
  delete process.env.FRONTEND_URL;
  process.env.JWT_SECRET = "security-policy-test-secret";
});
afterEach(() => {
  jest.restoreAllMocks();
  for (const [key, value] of Object.entries(previous)) {
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
});
function policyApp() {
  const app = express();
  app.use(helmet(helmetOptions));
  app.use(cors(corsOptions));
  app.get("/health", (req, res) => res.json({ ok: true }));
  app.use((error, req, res, _next) => { res.status(error.status || 500).json({ message: error.message }); });
  return app;
}

test("CORS accepts only the exact configured origin and refuses hostile or local origins in production", async () => {
  const app = policyApp();
  const accepted = await request(app).get("/health").set("Origin", "https://club.example").expect(200);
  expect(accepted.headers["access-control-allow-origin"]).toBe("https://club.example");
  expect(accepted.headers["access-control-allow-credentials"]).toBe("true");
  await request(app).get("/health").set("Origin", "https://club.example.evil.test").expect(403);
  await request(app).get("/health").set("Origin", "https://localhost:3000").expect(403);
  await request(app).get("/health").expect(200); // Server/native calls have no Origin.
});

test("cookie and CSRF request headers pass the trusted-origin preflight", async () => {
  const response = await request(policyApp()).options("/health").set("Origin", "https://club.example")
    .set("Access-Control-Request-Method", "POST").set("Access-Control-Request-Headers", "X-Auth-Transport,X-CSRF-Token").expect(204);
  expect(response.headers["access-control-allow-headers"]).toContain("X-CSRF-Token");
});

test("CSP blocks executable plugins and inline production scripts while permitting existing maps and media", async () => {
  const response = await request(policyApp()).get("/health").expect(200);
  const csp = response.headers["content-security-policy"];
  expect(csp).toContain("object-src 'none'");
  expect(csp).toContain("frame-ancestors 'none'");
  expect(csp.split(";").find((item) => item.startsWith("script-src"))).not.toContain("'unsafe-inline'");
  expect(csp).toContain("https://nominatim.openstreetmap.org");
  expect(securityHeaders(true)["Content-Security-Policy"]).toContain("'unsafe-inline'");
});

test("internal fetch preserves the user's permissions and adds an unforgeable service credential", async () => {
  const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue({ ok: true });
  await serviceFetch("http://identity.internal/api/adherents", { headers: { Authorization: "Bearer user-token" } });
  const headers = fetchMock.mock.calls[0][1].headers;
  expect(headers.get("Authorization")).toBe("Bearer user-token");
  expect(isInternalRequest({ headers: { "x-service-authorization": headers.get("X-Service-Authorization") } })).toBe(true);
  expect(isInternalRequest({ headers: { "x-service-authorization": `${getSystemAuthHeader()}x` } })).toBe(false);
});

test("session validation fails closed when identity is unreachable", async () => {
  jest.spyOn(global, "fetch").mockRejectedValue(new Error("connection refused"));
  await expect(validateRemoteSession({ id: 42, jti: "registered" }, "token")).rejects.toThrow("connection refused");
});
