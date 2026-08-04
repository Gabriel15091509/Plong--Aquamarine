const PaiementService = require("../src/services/PaiementService");

const service = new PaiementService();

const validData = {
  num_adherent: 1,
  montant: 50,
  mode: "Carte",
  type_paiement: "Autre",
};

describe("PaiementService.validatePaymentData", () => {
  test("accepte un jeu de données complet et valide", async () => {
    const errors = await service.validatePaymentData(validData);
    expect(errors).toEqual([]);
  });

  test("signale un montant nul ou négatif", async () => {
    const errors = await service.validatePaymentData({ ...validData, montant: 0 });
    expect(errors).toContain("Le montant doit être supérieur à 0");
  });

  test("signale les champs obligatoires manquants", async () => {
    const errors = await service.validatePaymentData({});
    expect(errors).toHaveLength(4);
  });

  test("exige reference_id pour un type Formation/Sortie/Adhesion", async () => {
    const errors = await service.validatePaymentData({ ...validData, type_paiement: "Formation" });
    expect(errors.some((e) => /formation concernée/.test(e))).toBe(true);
  });

  test("n'exige pas reference_id pour un type Autre", async () => {
    const errors = await service.validatePaymentData(validData);
    expect(errors.some((e) => /requise/.test(e))).toBe(false);
  });
});
