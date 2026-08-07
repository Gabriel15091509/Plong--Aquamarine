const {
  getAge,
  checkBaptemeDepthForAge,
  isSameCalendarDay,
  AGE_LIMITE_UNE_PLONGEE_PAR_JOUR,
} = require("../../src/utils/ageRules");

describe("ageRules", () => {
  describe("getAge", () => {
    it("calcule l'âge révolu avant l'anniversaire de l'année", () => {
      expect(getAge("2015-06-15", new Date("2026-06-01"))).toBe(10);
    });

    it("calcule l'âge révolu après l'anniversaire de l'année", () => {
      expect(getAge("2015-06-15", new Date("2026-06-30"))).toBe(11);
    });

    it("renvoie null pour une date de naissance absente ou invalide", () => {
      expect(getAge(null)).toBeNull();
      expect(getAge("pas une date")).toBeNull();
    });
  });

  describe("checkBaptemeDepthForAge", () => {
    it("bloque tout baptême en dessous de 8 ans", () => {
      expect(checkBaptemeDepthForAge(7, 2)).toMatch(/8 ans/);
    });

    it("autorise jusqu'à 2m pour 8-9 ans", () => {
      expect(checkBaptemeDepthForAge(8, 2)).toBeNull();
      expect(checkBaptemeDepthForAge(9, 2)).toBeNull();
    });

    it("bloque au-delà de 2m pour 8-9 ans", () => {
      expect(checkBaptemeDepthForAge(9, 3)).toMatch(/2m/);
    });

    it("autorise jusqu'à 3m pour 10-13 ans", () => {
      expect(checkBaptemeDepthForAge(10, 3)).toBeNull();
      expect(checkBaptemeDepthForAge(13, 3)).toBeNull();
    });

    it("bloque au-delà de 3m pour 10-13 ans", () => {
      expect(checkBaptemeDepthForAge(12, 4)).toMatch(/3m/);
    });

    it("n'impose aucun plafond spécifique à 14 ans et plus", () => {
      expect(checkBaptemeDepthForAge(14, 20)).toBeNull();
    });

    it("ne bloque jamais quand l'âge est inconnu", () => {
      expect(checkBaptemeDepthForAge(null, 40)).toBeNull();
      expect(checkBaptemeDepthForAge(undefined, 40)).toBeNull();
    });
  });

  describe("isSameCalendarDay", () => {
    it("détecte le même jour malgré des horaires différents", () => {
      expect(isSameCalendarDay("2026-06-15T10:00:00Z", "2026-06-15T11:30:00Z")).toBe(true);
    });

    it("distingue deux jours différents", () => {
      expect(isSameCalendarDay("2026-06-15T10:00:00Z", "2026-06-16T10:00:00Z")).toBe(false);
    });
  });

  describe("AGE_LIMITE_UNE_PLONGEE_PAR_JOUR", () => {
    it("vaut 12 ans", () => {
      expect(AGE_LIMITE_UNE_PLONGEE_PAR_JOUR).toBe(12);
    });
  });
});
