// Régression : une sortie annulée doit rendre impossibles (1) la création
// d'une nouvelle inscription, (2) la confirmation/mise en liste d'attente ou
// le pointage de présence d'une inscription existante restée "En attente" au
// moment de l'annulation, et (3) la promotion automatique du suivant de la
// liste d'attente quand une inscription "Confirmée" de cette sortie est
// annulée après coup (InscriptionService.confirmInscription/update,
// InscriptionWaitlistService.promoteNextFromWaitlist).
//
// Même style que sortie.integration.test.js : vrai app.js + vraie base
// Postgres via Supertest, sans mock. Les inscriptions de fixture sont créées
// directement via le modèle Sequelize (num_adherent est une simple colonne
// texte, sans FK vers identite-service) pour éviter toute dépendance aux
// autres microservices sur ce chemin de test précis.
const jwt = require("jsonwebtoken");
const request = require("supertest");
const { app } = require("../../src/app");
const { sequelize, Sortie, Inscription } = require("../../src/models");

function tokenFor(role) {
  return jwt.sign(
    { id: 1, email: `${role}@test.local`, role, name: "Test" },
    process.env.JWT_SECRET,
    { expiresIn: "1h" },
  );
}

const presidentToken = tokenFor("president");

let sortieAnnulee;
let inscriptionEnAttente;
let inscriptionConfirmee;
let inscriptionListeAttente;

beforeAll(async () => {
  sortieAnnulee = await Sortie.create({
    type: "Plongée",
    lieu: "Saint-Leu",
    site: "Fixture intégration (sortie annulée)",
    date_heure: "2026-12-20T08:00:00.000Z",
    nb_places: 6,
    niveau_requis: "Niveau 1",
    profondeur_max: 15,
    duree_estimee: "00:40:00",
    date_ouverture_inscriptions: "2026-11-20T00:00:00.000Z",
    statut: "Annulée",
    motif_annulation: "Fixture de test",
  });

  inscriptionEnAttente = await Inscription.create({
    num_adherent: "ADH-TEST-9001",
    id_sortie: sortieAnnulee.id_sortie,
    statut: "En attente",
  });

  inscriptionConfirmee = await Inscription.create({
    num_adherent: "ADH-TEST-9002",
    id_sortie: sortieAnnulee.id_sortie,
    statut: "Confirmée",
    date_confirmation: new Date(),
  });

  inscriptionListeAttente = await Inscription.create({
    num_adherent: "ADH-TEST-9003",
    id_sortie: sortieAnnulee.id_sortie,
    statut: "Liste d'attente",
    rang_liste_attente: 1,
  });
});

afterAll(async () => {
  await Inscription.destroy({ where: { id_sortie: sortieAnnulee.id_sortie } });
  await sortieAnnulee.destroy();
  await sequelize.close();
});

test("POST /api/inscriptions refuse une nouvelle inscription sur une sortie annulée", async () => {
  const res = await request(app)
    .post("/api/inscriptions")
    .set("Authorization", `Bearer ${presidentToken}`)
    .send({ num_adherent: "ADH-TEST-9099", id_sortie: sortieAnnulee.id_sortie });
  expect(res.status).toBe(400);
  expect(res.body.message).toMatch(/annulée/);
});

test("PATCH /api/inscriptions/:id/confirm refuse de confirmer sur une sortie annulée", async () => {
  const res = await request(app)
    .patch(`/api/inscriptions/${inscriptionEnAttente.id_inscription}/confirm`)
    .set("Authorization", `Bearer ${presidentToken}`);
  expect(res.status).toBe(400);
  expect(res.body.message).toMatch(/annulée/);

  await inscriptionEnAttente.reload();
  expect(inscriptionEnAttente.statut).toBe("En attente");
});

test("PUT /api/inscriptions/:id refuse la mise en liste d'attente sur une sortie annulée", async () => {
  const res = await request(app)
    .put(`/api/inscriptions/${inscriptionEnAttente.id_inscription}`)
    .set("Authorization", `Bearer ${presidentToken}`)
    .send({ statut: "Liste d'attente" });
  expect(res.status).toBe(400);
  expect(res.body.message).toMatch(/annulée/);
});

test("PUT /api/inscriptions/:id refuse un pointage de présence sur une sortie annulée", async () => {
  const res = await request(app)
    .put(`/api/inscriptions/${inscriptionEnAttente.id_inscription}`)
    .set("Authorization", `Bearer ${presidentToken}`)
    .send({ presence: true, presence_checked: true });
  expect(res.status).toBe(400);
  expect(res.body.message).toMatch(/annulée/);

  await inscriptionEnAttente.reload();
  expect(inscriptionEnAttente.presence_checked).toBe(false);
});

test("PUT /api/inscriptions/:id autorise toujours l'annulation d'une inscription, même sur une sortie déjà annulée", async () => {
  const res = await request(app)
    .put(`/api/inscriptions/${inscriptionEnAttente.id_inscription}`)
    .set("Authorization", `Bearer ${presidentToken}`)
    .send({ statut: "Annulée" });
  expect(res.status).toBe(200);
  expect(res.body.data.statut).toBe("Annulée");
});

test("annuler une inscription Confirmée d'une sortie annulée ne promeut PAS le suivant de la liste d'attente", async () => {
  const res = await request(app)
    .patch(`/api/inscriptions/${inscriptionConfirmee.id_inscription}/cancel`)
    .set("Authorization", `Bearer ${presidentToken}`);
  expect(res.status).toBe(200);
  expect(res.body.data.statut).toBe("Annulée");

  await inscriptionListeAttente.reload();
  expect(inscriptionListeAttente.statut).toBe("Liste d'attente");
});
