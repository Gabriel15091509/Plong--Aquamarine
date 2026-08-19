// Régression : InscriptionRepository.create filtrait les données écrites en
// base avec une liste blanche qui avait oublié montant_du/montant_paye/paye
// — le tarif calculé par InscriptionService (computeMontantDu, voir
// tarifRules.test.js) était donc systématiquement perdu à l'écriture, et
// repartait sur son défaut (montant_du: null → affiché "Gratuit" côté
// frontend) quel que soit le tarif réel de la sortie. Constaté en direct sur
// l'app lancée (POST /api/inscriptions renvoyait "montant_du": null pour une
// sortie à 7,85 €) avant d'être corrigé ici.
jest.mock("../../src/models", () => ({
  Inscription: { create: jest.fn() },
  Sortie: {},
}));

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
