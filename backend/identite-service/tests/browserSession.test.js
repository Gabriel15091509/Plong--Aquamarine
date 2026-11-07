jest.mock("../src/models", () => ({ User: { findOne: jest.fn(), findByPk: jest.fn(), update: jest.fn(), increment: jest.fn() } }));
jest.mock("../src/utils/email", () => ({ sendPasswordResetEmail: jest.fn(), sendOtpEmail: jest.fn() }));
jest.mock("../src/models/AuthSession", () => {
  const { Op } = require("sequelize");
  const rows = new Map();
  return { rows,
    create: jest.fn(async (row) => { rows.set(row.token_hash, { ...row }); return row; }),
    update: jest.fn(async (values, { where }) => {
      const row = rows.get(where.token_hash);
      if (!row || row.user_id !== where.user_id || row.credential_hash !== where.credential_hash || row.expires_at <= where.expires_at[Op.gt] || row.last_seen_at <= where.last_seen_at[Op.gt]) return [0];
      Object.assign(row, values); return [1];
    }),
    destroy: jest.fn(async ({ where }) => { for (const [key, row] of rows) if (key === where.token_hash || row.user_id === where.user_id) rows.delete(key); }),
  };
});

const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const { User } = require("../src/models");
const AuthSession = require("../src/models/AuthSession");
const { sendOtpEmail } = require("../src/utils/email");
const { apiAccess } = require("../../shared/apiAccess");
const { validateRemoteSession } = require("../../shared/sessionValidation");
const { getSystemAuthHeader } = require("../../shared/serviceAuth");
const AdherentService = require("../src/services/AdherentService");
const { browserSession, SESSION_COOKIE } = require("../../shared/browserSession");
const AuthMiddleware = require("../src/middlewares/authMiddleware");
const authRoutes = require("../src/routes/authRoutes");
const proxyTo = require("../../gateway-service/src/middlewares/proxyTo");

const app = express();
app.use(express.json());
app.use("/api", browserSession);
app.use("/api", apiAccess(AuthMiddleware.authenticate));
app.use("/api/auth", authRoutes);
app.use("/api", require("../src/routes/adherentRoutes"));
app.post("/api/protected", AuthMiddleware.authenticate, (req, res) => res.json({ id: req.user.id }));

const cookiesFrom = (response) => response.headers["set-cookie"].map((cookie) => cookie.split(";")[0]).join("; ");
let user;
beforeEach(() => {
  jest.restoreAllMocks();
  AuthSession.rows.clear();
  process.env.JWT_SECRET = "browser-session-test-secret";
  process.env.NODE_ENV = "test";
  user = { id: 42, email: "test@example.com", name: "Test", role: "adherent", active: true,
    must_change_password: false, comparePassword: jest.fn().mockResolvedValue(true),
    password: "stored-password-hash", update: jest.fn(async (values) => Object.assign(user, values)), save: jest.fn().mockResolvedValue() };
  User.findOne.mockResolvedValue(user);
  User.findByPk.mockResolvedValue(user);
  User.update.mockImplementation(async (values, { where }) => {
    if (where.otp_code_hash && where.otp_code_hash !== user.otp_code_hash) return [0];
    Object.assign(user, values); return [1];
  });
  User.increment.mockImplementation(async () => { user.otp_attempts += 1; });
  sendOtpEmail.mockReset().mockResolvedValue({ messageId: "smtp-delivered" });
});

async function webLogin() {
  const csrf = await request(app).get("/api/auth/csrf").set("X-Auth-Transport", "cookie").expect(200);
  return request(app).post("/api/auth/login").set("X-Auth-Transport", "cookie")
    .set("Cookie", cookiesFrom(csrf)).set("X-CSRF-Token", csrf.body.data.csrfToken)
    .send({ email: user.email, password: "password" }).expect(200);
}

test("web login sets a host-only HttpOnly Secure SameSite cookie and never exposes the JWT", async () => {
  const login = await webLogin();
  expect(login.body.data.token).toBeUndefined();
  expect(login.body.data.csrfToken).toMatch(/^[a-f0-9]{64}$/);
  const cookie = login.headers["set-cookie"].find((value) => value.startsWith(`${SESSION_COOKIE}=`));
  expect(cookie).toContain("HttpOnly");
  expect(cookie).toContain("Secure");
  expect(cookie).toContain("SameSite=Strict");
  expect(cookie).toContain("Path=/");
  expect(cookie).not.toContain("Domain=");
  expect(login.headers["cache-control"]).toBe("no-store");
});

test("mobile login still returns a Bearer token without session cookies", async () => {
  const login = await request(app).post("/api/auth/login").send({ email: user.email, password: "password" }).expect(200);
  expect(jwt.verify(login.body.data.token, process.env.JWT_SECRET).id).toBe(42);
  expect(login.headers["set-cookie"]).toBeUndefined();
  await request(app).post("/api/protected").set("Authorization", `Bearer ${login.body.data.token}`).expect(200);
});

test("cookie writes require a CSRF proof bound to this session, including logout", async () => {
  const login = await webLogin();
  const cookie = cookiesFrom(login);
  await request(app).post("/api/protected").set("Cookie", cookie).expect(403);
  await request(app).post("/api/protected").set("Cookie", cookie).set("X-CSRF-Token", "0".repeat(64)).expect(403);
  const other = await webLogin();
  await request(app).post("/api/protected").set("Cookie", cookie).set("X-CSRF-Token", other.body.data.csrfToken).expect(403);
  await request(app).post("/api/protected").set("Cookie", cookie).set("X-CSRF-Token", login.body.data.csrfToken).expect(200);
  await request(app).post("/api/auth/logout").set("Cookie", cookie).expect(403);
  const logout = await request(app).post("/api/auth/logout").set("Cookie", cookie)
    .set("X-CSRF-Token", login.body.data.csrfToken).expect(200);
  expect(logout.headers["set-cookie"].find((value) => value.startsWith(`${SESSION_COOKIE}=`))).toContain("Expires=Thu, 01 Jan 1970");
});

test("login itself requires CSRF in cookie mode", async () => {
  await request(app).post("/api/auth/login").set("X-Auth-Transport", "cookie")
    .send({ email: user.email, password: "password" }).expect(403);
});

test("session restoration validates the cookie, expiry and active account", async () => {
  await request(app).get("/api/auth/session").expect(401);
  const login = await webLogin();
  const session = await request(app).get("/api/auth/session").set("Cookie", cookiesFrom(login)).expect(200);
  expect(session.body.data.user.id).toBe(42);
  expect(session.body.data.token).toBeUndefined();
  user.active = false;
  await request(app).get("/api/auth/session").set("Cookie", cookiesFrom(login)).expect(401);
  const expired = jwt.sign({ id: 42 }, process.env.JWT_SECRET, { expiresIn: -1 });
  await request(app).get("/api/auth/session").set("Cookie", `${SESSION_COOKIE}=${expired}`).expect(401);
});

test("password changes rotate the cookie and CSRF proof without exposing a JWT", async () => {
  const login = await webLogin();
  const changed = await request(app).post("/api/auth/change-password").set("Cookie", cookiesFrom(login))
    .set("X-CSRF-Token", login.body.data.csrfToken)
    .send({ oldPassword: "password", newPassword: "NewPassword1!" }).expect(200);
  expect(changed.body.data.token).toBeUndefined();
  expect(changed.body.data.csrfToken).not.toBe(login.body.data.csrfToken);
  await request(app).post("/api/protected").set("Cookie", cookiesFrom(changed))
    .set("X-CSRF-Token", changed.body.data.csrfToken).expect(200);
});

test("CSRF can be restored after a tab reload without exposing the session token", async () => {
  const login = await webLogin();
  const csrf = await request(app).get("/api/auth/csrf").set("Cookie", cookiesFrom(login)).expect(200);
  expect(csrf.body.data.csrfToken).toBe(login.body.data.csrfToken);
  expect(csrf.body.data.token).toBeUndefined();
});

test("a copied JWT is rejected after logout even when its signature is still valid", async () => {
  const login = await webLogin();
  const cookie = cookiesFrom(login);
  const token = cookie.split("; ").find((value) => value.startsWith(`${SESSION_COOKIE}=`)).slice(SESSION_COOKIE.length + 1);
  await request(app).post("/api/auth/logout").set("Cookie", cookie).set("X-CSRF-Token", login.body.data.csrfToken).expect(200);
  expect(jwt.verify(token, process.env.JWT_SECRET).id).toBe(42);
  await request(app).post("/api/protected").set("Authorization", `Bearer ${token}`).expect(401);
});

test("idle-expired sessions and sessions with changed credentials cannot be reused", async () => {
  const login = await webLogin();
  for (const row of AuthSession.rows.values()) row.last_seen_at = new Date(Date.now() - 16 * 60 * 1000);
  await request(app).get("/api/auth/session").set("Cookie", cookiesFrom(login)).expect(401);
  const fresh = await webLogin();
  user.password = "a-different-password-hash";
  await request(app).get("/api/auth/session").set("Cookie", cookiesFrom(fresh)).expect(401);
});

test("president login requires an emailed OTP, which can be consumed only once", async () => {
  user.role = "president";
  const challenge = await webLogin();
  expect(challenge.body.data.otpRequired).toBe(true);
  expect(challenge.headers["set-cookie"]).toBeUndefined();
  expect(AuthSession.rows.size).toBe(0);
  const code = sendOtpEmail.mock.calls[0][0].code;
  const csrf = await request(app).get("/api/auth/csrf").set("X-Auth-Transport", "cookie");
  const verify = () => request(app).post("/api/auth/verify-otp").set("X-Auth-Transport", "cookie")
    .set("Cookie", cookiesFrom(csrf)).set("X-CSRF-Token", csrf.body.data.csrfToken).send({ email: user.email, code });
  const verified = await verify().expect(200);
  expect(verified.body.data.user.role).toBe("president");
  await verify().expect(401);
});

test("a president receives no session if email delivery fails", async () => {
  user.role = "president";
  sendOtpEmail.mockRejectedValueOnce(new Error("SMTP unavailable"));
  const response = await request(app).post("/api/auth/login").send({ email: user.email, password: "password" }).expect(500);
  expect(response.body.data).toBeUndefined();
  expect(AuthSession.rows.size).toBe(0);
});

test("unregistered JWTs and unauthenticated internal introspection are rejected", async () => {
  const legacy = jwt.sign({ id: user.id, role: "president" }, process.env.JWT_SECRET);
  await request(app).get("/api/auth/session").set("Authorization", `Bearer ${legacy}`).expect(401);
  await request(app).post("/api/auth/introspect").send({ token: legacy }).expect(403);
});

test("remote service validation observes revocation immediately through authenticated HTTP introspection", async () => {
  const login = await webLogin();
  const token = cookiesFrom(login).split("; ").find((value) => value.startsWith(`${SESSION_COOKIE}=`)).slice(SESSION_COOKIE.length + 1);
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const previous = process.env.IDENTITE_SERVICE_URL;
  process.env.IDENTITE_SERVICE_URL = `http://127.0.0.1:${server.address().port}/api`;
  try {
    expect(await validateRemoteSession(decoded, token)).toBe(true);
    await request(app).post("/api/auth/logout").set("Cookie", cookiesFrom(login)).set("X-CSRF-Token", login.body.data.csrfToken).expect(200);
    expect(await validateRemoteSession(decoded, token)).toBe(false);
    const internal = jwt.verify(getSystemAuthHeader().slice(7), process.env.JWT_SECRET);
    expect(await validateRemoteSession(internal, getSystemAuthHeader().slice(7))).toBe(true);
  } finally {
    if (previous === undefined) delete process.env.IDENTITE_SERVICE_URL;
    else process.env.IDENTITE_SERVICE_URL = previous;
    await new Promise((resolve) => server.close(resolve));
  }
});

test.each(["gateway-service", "activites-service", "formation-service", "materiel-service", "finance-service", "vie-associative-service"])("%s rejects revoked sessions through its real authentication middleware", async (service) => {
  const login = await webLogin();
  const cookie = cookiesFrom(login);
  const token = cookie.split("; ").find((value) => value.startsWith(`${SESSION_COOKIE}=`)).slice(SESSION_COOKIE.length + 1);
  const identity = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => identity.once("listening", resolve));
  const previous = process.env.IDENTITE_SERVICE_URL;
  process.env.IDENTITE_SERVICE_URL = `http://127.0.0.1:${identity.address().port}`;
  const Auth = require(`../../${service}/src/middlewares/authMiddleware`);
  const remote = express();
  remote.use(browserSession);
  remote.use(apiAccess(Auth.authenticate));
  remote.get("/private", (req, res) => res.json({ id: req.user.id }));
  try {
    await request(remote).get("/private").expect(401);
    await request(remote).get("/private").set("Authorization", `Bearer ${token}`).expect(200);
    await request(app).post("/api/auth/logout").set("Cookie", cookie).set("X-CSRF-Token", login.body.data.csrfToken).expect(200);
    await request(remote).get("/private").set("Authorization", `Bearer ${token}`).expect(401);
    await request(remote).get("/private").set("Authorization", getSystemAuthHeader()).expect(200);
  } finally {
    if (previous === undefined) delete process.env.IDENTITE_SERVICE_URL; else process.env.IDENTITE_SERVICE_URL = previous;
    await new Promise((resolve) => identity.close(resolve));
  }
});

test("the level update route rejects browser calls but accepts authenticated internal calls", async () => {
  const update = jest.spyOn(AdherentService.prototype, "updateNiveau").mockResolvedValue({ niveau: "Niveau 2" });
  const login = await webLogin();
  await request(app).patch("/api/adherents/A001/niveau").set("Cookie", cookiesFrom(login))
    .set("X-CSRF-Token", login.body.data.csrfToken).send({ niveau: "Niveau 2" }).expect(403);
  expect(update).not.toHaveBeenCalled();
  await request(app).patch("/api/adherents/A001/niveau").set("Authorization", getSystemAuthHeader())
    .set("X-Service-Authorization", getSystemAuthHeader()).send({ niveau: "Niveau 2" }).expect(200);
  expect(update).toHaveBeenCalledTimes(1);
});

test("profile resolution is limited to its owner or staff", async () => {
  const lookup = jest.spyOn(AdherentService.prototype, "getByUserId").mockResolvedValue({ num_adherent: "A001" });
  const login = await webLogin();
  await request(app).get("/api/adherents/user/99").set("Cookie", cookiesFrom(login)).expect(403);
  expect(lookup).not.toHaveBeenCalled();
  await request(app).get("/api/adherents/user/42").set("Cookie", cookiesFrom(login)).expect(200);
  await request(app).get("/api/adherents/user/99").set("Authorization", getSystemAuthHeader()).expect(200);
});

test("changing a role invalidates the existing session even though its JWT signature remains valid", async () => {
  const login = await webLogin();
  user.role = "moniteur";
  await request(app).get("/api/auth/session").set("Cookie", cookiesFrom(login)).expect(401);
});

test("gateway forwards all Set-Cookie headers separately and preserves no-store", async () => {
  const server = express();
  server.use("/api", proxyTo("http://identity.internal"));
  const cookies = [`${SESSION_COOKIE}=abc; Path=/; HttpOnly; Secure; SameSite=Strict`, "other=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/"];
  const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue({ status: 200,
    headers: { get: (key) => key === "cache-control" ? "no-store" : "application/json", getSetCookie: () => cookies },
    arrayBuffer: async () => Buffer.from('{"success":true}') });
  try {
    const response = await request(server).get("/api/auth/session").expect(200);
    expect(response.headers["set-cookie"]).toEqual(cookies);
    expect(response.headers["cache-control"]).toBe("no-store");
  } finally { fetchMock.mockRestore(); }
});
