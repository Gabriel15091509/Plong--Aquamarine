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

describe("PaiementService.getPaymentsForExport", () => {
  test("délègue au repository avec les dates fournies", async () => {
    const spy = jest
      .spyOn(service.paiementRepository, "findByPeriod")
      .mockResolvedValue([{ id_paiement: 1 }]);

    const startDate = new Date("2026-01-01");
    const endDate = new Date("2026-01-31");
    const result = await service.getPaymentsForExport(startDate, endDate);

    expect(spy).toHaveBeenCalledWith(startDate, endDate);
    expect(result).toEqual([{ id_paiement: 1 }]);
    spy.mockRestore();
  });
});
