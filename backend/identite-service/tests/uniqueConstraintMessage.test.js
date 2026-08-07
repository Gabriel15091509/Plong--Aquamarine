const { friendlyUniqueConstraintMessage } = require("../src/utils/uniqueConstraintMessage");

describe("friendlyUniqueConstraintMessage", () => {
  test("identifie un conflit sur le numéro de licence FFESM", () => {
    const error = { errors: [{ path: "num_licence_ffesm" }] };
    expect(friendlyUniqueConstraintMessage(error)).toBe(
      "Un autre adhérent utilise déjà ce numéro de licence FFESM",
    );
  });

  test("identifie un conflit sur l'email", () => {
    const error = { errors: [{ path: "email" }] };
    expect(friendlyUniqueConstraintMessage(error)).toBe("Un autre adhérent utilise déjà cet email");
  });

  test("retombe sur un message générique pour une colonne non mappée", () => {
    const error = { errors: [{ path: "colonne_inconnue" }] };
    expect(friendlyUniqueConstraintMessage(error)).toBe("Un autre adhérent utilise déjà une de ces valeurs");
  });

  test("ne plante pas si error.errors est absent", () => {
    expect(friendlyUniqueConstraintMessage({})).toBe("Un autre adhérent utilise déjà une de ces valeurs");
  });
});
