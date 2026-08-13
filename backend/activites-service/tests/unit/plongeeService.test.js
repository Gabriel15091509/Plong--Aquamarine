const PlongeeService = require("../../src/services/PlongeeService");

const service = new PlongeeService();

describe("PlongeeService.assertPlongeeModifiable", () => {
  test("ne lève pas pour une plongée non validée", () => {
    expect(() =>
      service.assertPlongeeModifiable({ id_moniteur_validateur: null }),
    ).not.toThrow();
  });

  test("lève pour une plongée déjà validée par un moniteur", () => {
    expect(() =>
      service.assertPlongeeModifiable({ id_moniteur_validateur: 3 }),
    ).toThrow(/validée/);
  });
});
