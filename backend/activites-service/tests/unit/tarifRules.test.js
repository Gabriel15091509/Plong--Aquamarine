const { computeMontantDu } = require("../../src/utils/tarifRules");

describe("tarifRules.computeMontantDu", () => {
  const sortie = { tarif_adherent: 20, tarif_non_adherent: 35 };

  test("applique le tarif adhérent par défaut", () => {
    expect(computeMontantDu(sortie, { est_invite: false })).toBe(20);
  });

  test("applique le tarif non-adhérent pour un invité", () => {
    expect(computeMontantDu(sortie, { est_invite: true })).toBe(35);
  });

  test("retombe sur le tarif adhérent si le tarif non-adhérent n'est pas renseigné", () => {
    expect(computeMontantDu({ tarif_adherent: 20, tarif_non_adherent: null }, { est_invite: true })).toBe(20);
  });

  test("gère un adherentRecord absent sans lever d'erreur", () => {
    expect(computeMontantDu(sortie, null)).toBe(20);
  });

  test("renvoie 0 (jamais NaN) si aucun tarif n'est renseigné", () => {
    expect(computeMontantDu({}, { est_invite: false })).toBe(0);
  });
});
