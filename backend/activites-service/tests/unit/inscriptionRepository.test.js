// Régression : InscriptionRepository.create filtrait les données écrites en
// base avec une liste blanche qui avait oublié montant_du/montant_paye/paye
// — le tarif calculé par InscriptionService (computeMontantDu, voir
// tarifRules.test.js) était donc systématiquement perdu à l'écriture, et
// repartait sur son défaut (montant_du: null → affiché "Gratuit" côté
// frontend) quel que soit le tarif réel de la sortie. Constaté en direct sur
// l'app lancée (POST /api/inscriptions renvoyait "montant_du": null pour une
// sortie à 7,85 €) avant d'être corrigé ici.
jest.mock("../../src/models", () => ({
  Inscription: { create: jest.fn(), update: jest.fn(), count: jest.fn() },
  Sortie: {},
}));

const { Op } = require("sequelize");
const { Inscription } = require("../../src/models");
const InscriptionRepository = require("../../src/repositories/InscriptionRepository");

describe("InscriptionRepository.create", () => {
  beforeEach(() => {
    Inscription.create.mockClear();
  });

  test("transmet montant_du, montant_paye et paye tels que calculés par le service", async () => {
    const repo = new InscriptionRepository();
    await repo.create({
      num_adherent: "ADH-2026-0001",
      id_sortie: "42",
      statut: "En attente",
      montant_du: 7.85,
      montant_paye: 0,
      paye: false,
    });

    expect(Inscription.create).toHaveBeenCalledWith(
      expect.objectContaining({ montant_du: 7.85, montant_paye: 0, paye: false }),
      {},
    );
  });

  test("une sortie gratuite (montant_du: 0) reste bien 0, pas null", async () => {
    const repo = new InscriptionRepository();
    await repo.create({
      num_adherent: "ADH-2026-0001",
      id_sortie: "42",
      statut: "En attente",
      montant_du: 0,
      montant_paye: 0,
      paye: true,
    });

    expect(Inscription.create).toHaveBeenCalledWith(
      expect.objectContaining({ montant_du: 0, paye: true }),
      {},
    );
  });
});

// Sortie passée "En cours" (SortieService.annulerInscriptionsNonConfirmees) :
// les inscriptions En attente/Liste d'attente de cette sortie doivent être
// annulées en bloc, sans toucher aux Confirmée ni aux autres sorties.
describe("InscriptionRepository.annulerNonConfirmeesBySortie", () => {
  beforeEach(() => {
    Inscription.update.mockClear();
    Inscription.update.mockResolvedValue([2]);
  });

  test("annule En attente et Liste d'attente, scopé à la sortie donnée", async () => {
    const repo = new InscriptionRepository();
    const count = await repo.annulerNonConfirmeesBySortie(42);

    expect(Inscription.update).toHaveBeenCalledWith(
      { statut: "Annulée", rang_liste_attente: null },
      {
        where: {
          id_sortie: 42,
          statut: { [Op.in]: ["En attente", "Liste d'attente"] },
        },
      },
    );
    expect(count).toBe(2);
  });
});

// Sortie replanifiée après une annulation météo (SortieService.replanifier)
// : les inscriptions Confirmée de cette sortie doivent repasser En attente
// avec reconfirmation_requise, scopé à la sortie donnée.
describe("InscriptionRepository.remettreEnAttenteConfirmeesBySortie", () => {
  beforeEach(() => {
    Inscription.update.mockClear();
    Inscription.update.mockResolvedValue([3]);
  });

  test("remet En attente les Confirmée, pose reconfirmation_requise, scopé à la sortie donnée", async () => {
    const repo = new InscriptionRepository();
    const count = await repo.remettreEnAttenteConfirmeesBySortie(42);

    expect(Inscription.update).toHaveBeenCalledWith(
      { statut: "En attente", date_confirmation: null, reconfirmation_requise: true },
      { where: { id_sortie: 42, statut: "Confirmée" } },
    );
    expect(count).toBe(3);
  });
});

// Badge Sidebar.jsx (InscriptionService.getPendingCount) : un simple COUNT
// filtré par statut, sans charger les lignes (contrairement à
// getInscriptionStats ci-dessous, qui charge tout pour compter plusieurs
// statuts à la fois — inutile ici, un seul statut nous intéresse).
describe("InscriptionRepository.countPending", () => {
  beforeEach(() => {
    Inscription.count.mockClear();
    Inscription.count.mockResolvedValue(7);
  });

  test("compte uniquement les inscriptions 'En attente'", async () => {
    const repo = new InscriptionRepository();
    const count = await repo.countPending();

    expect(Inscription.count).toHaveBeenCalledWith({ where: { statut: "En attente" } });
    expect(count).toBe(7);
  });
});
