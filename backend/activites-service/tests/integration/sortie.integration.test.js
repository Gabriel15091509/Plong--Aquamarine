// Tests d'intégration : Express (vrai app.js, middlewares compris) + vraie
// base Postgres, via Supertest. Volontairement sans mock de la base : les FK
// applicatives inter-schémas de ce projet (pas de vraies FK Postgres, voir
// modèles) sont justement le genre de bug qu'un mock masquerait.
//
// Entièrement autonome vis-à-vis des données déjà présentes : une seule
// sortie de fixture est créée en amont (`beforeAll`) et supprimée à la fin
// (`afterAll`), sans jamais supposer un volume de données préexistant — ce
// fichier doit passer aussi bien sur la base de démo locale (des centaines
// de sorties déjà seedées) que sur une base CI fraîchement créée et vide.
const jwt = require("jsonwebtoken");
const request = require("supertest");
const { app } = require("../../src/app");
const { sequelize, Sortie } = require("../../src/models");

function tokenFor(role) {
  return jwt.sign(
    { id: 1, email: `${role}@test.local`, role, name: "Test" },
    process.env.JWT_SECRET,
    { expiresIn: "1h" },
  );
}

const presidentToken = tokenFor("president");
const adherentToken = tokenFor("adherent");

let fixtureSortie;

beforeAll(async () => {
  fixtureSortie = await Sortie.create({
    type: "Plongée",
    lieu: "Saint-Leu",
    site: "Fixture intégration (liste)",
    date_heure: "2026-12-15T08:00:00.000Z",
    nb_places: 6,
    niveau_requis: "Niveau 1",
    profondeur_max: 15,
    duree_estimee: "00:40:00",
    date_ouverture_inscriptions: "2026-11-15T00:00:00.000Z",
  });
});

afterAll(async () => {
  await fixtureSortie.destroy();
  await sequelize.close();
});

test("GET /api/sorties sans token renvoie 401", async () => {
  const res = await request(app).get("/api/sorties");
  expect(res.status).toBe(401);
  expect(res.body.success).toBe(false);
});

test("GET /api/sorties avec un token valide renvoie 200 et contient la fixture", async () => {
  const res = await request(app)
    .get("/api/sorties")
    .set("Authorization", `Bearer ${presidentToken}`);
  expect(res.status).toBe(200);
  expect(res.body.success).toBe(true);
  expect(Array.isArray(res.body.data)).toBe(true);
  expect(res.body.data.some((s) => s.id_sortie === fixtureSortie.id_sortie)).toBe(true);
});

test("GET /api/sorties/:id sur une sortie existante renvoie ses données", async () => {
  const res = await request(app)
    .get(`/api/sorties/${fixtureSortie.id_sortie}`)
    .set("Authorization", `Bearer ${presidentToken}`);
  expect(res.status).toBe(200);
  expect(res.body.data.id_sortie).toBe(fixtureSortie.id_sortie);
  expect(res.body.data.site).toBe("Fixture intégration (liste)");
});

test("GET /api/sorties/:id sur un id inexistant renvoie 404", async () => {
  const res = await request(app)
    .get("/api/sorties/999999")
    .set("Authorization", `Bearer ${presidentToken}`);
  expect(res.status).toBe(404);
});

test("POST /api/sorties avec des données incomplètes renvoie 400 avec le détail des erreurs", async () => {
  const res = await request(app)
    .post("/api/sorties")
    .set("Authorization", `Bearer ${presidentToken}`)
    .send({});
  expect(res.status).toBe(400);
  expect(res.body.success).toBe(false);
  expect(res.body.errors.some((e) => e.field === "site")).toBe(true);
});

test("POST /api/sorties refusé à un adhérent (rôle insuffisant)", async () => {
  const res = await request(app)
    .post("/api/sorties")
    .set("Authorization", `Bearer ${adherentToken}`)
    .send({
      type: "Plongée",
      lieu: "Saint-Leu",
      site: "Test intégration",
      date_heure: "2026-12-01T08:00:00.000Z",
      nb_places: 6,
    });
  expect(res.status).toBe(403);
});

test("cycle complet POST → GET → PUT → DELETE pour une sortie", async () => {
  const createRes = await request(app)
    .post("/api/sorties")
    .set("Authorization", `Bearer ${presidentToken}`)
    .send({
      type: "Plongée",
      lieu: "Saint-Leu",
      site: "Test intégration",
      date_heure: "2026-12-01T08:00:00.000Z",
      nb_places: 6,
      niveau_requis: "Niveau 1",
      profondeur_max: 20,
      duree_estimee: "00:45:00",
      date_ouverture_inscriptions: "2026-11-01T00:00:00.000Z",
    });
  expect(createRes.status).toBe(201);
  const id = createRes.body.data.id_sortie;

  try {
    const getRes = await request(app)
      .get(`/api/sorties/${id}`)
      .set("Authorization", `Bearer ${presidentToken}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.site).toBe("Test intégration");

    const putRes = await request(app)
      .put(`/api/sorties/${id}`)
      .set("Authorization", `Bearer ${presidentToken}`)
      .send({ nb_places: 10 });
    expect(putRes.status).toBe(200);
    expect(putRes.body.data.nb_places).toBe(10);
  } finally {
    const delRes = await request(app)
      .delete(`/api/sorties/${id}`)
      .set("Authorization", `Bearer ${presidentToken}`);
    expect(delRes.status).toBe(200);
  }

  const getAfterDelete = await request(app)
    .get(`/api/sorties/${id}`)
    .set("Authorization", `Bearer ${presidentToken}`);
  expect(getAfterDelete.status).toBe(404);
});
