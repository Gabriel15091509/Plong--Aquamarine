const BaseRepository = require("../../src/repositories/BaseRepository");

// Reproduit le bug réel remonté en test manuel : un champ optionnel
// numérique (ex. Plongee.id_seance) laissé vide dans un formulaire arrive
// en "" plutôt qu'en null, ce que Postgres refuse tel quel ("invalid
// input syntax for type integer: ''"). BaseRepository.create/update
// doivent normaliser ces "" en null avant d'atteindre Sequelize, comme ils
// le faisaient déjà pour les champs DATE/DATEONLY.
function makeFakeModel(rawAttributes) {
  return {
    rawAttributes,
    create: jest.fn(async (data) => data),
    findByPk: jest.fn(),
  };
}

describe("BaseRepository — normalisation des champs optionnels vides", () => {
  test("convertit une chaîne vide en null pour un champ INTEGER (create)", async () => {
    const model = makeFakeModel({ id_seance: { type: { key: "INTEGER" } } });
    const repo = new BaseRepository(model);
    await repo.create({ id_seance: "" });
    expect(model.create).toHaveBeenCalledWith({ id_seance: null });
  });

  test("convertit une chaîne vide en null pour un champ DECIMAL (create)", async () => {
    const model = makeFakeModel({
      tarif_non_adherent: { type: { key: "DECIMAL" } },
    });
    const repo = new BaseRepository(model);
    await repo.create({ tarif_non_adherent: "" });
    expect(model.create).toHaveBeenCalledWith({ tarif_non_adherent: null });
  });

  test("convertit une chaîne vide en null pour un champ FLOAT (create)", async () => {
    const model = makeFakeModel({
      temperature_eau: { type: { key: "FLOAT" } },
    });
    const repo = new BaseRepository(model);
    await repo.create({ temperature_eau: "" });
    expect(model.create).toHaveBeenCalledWith({ temperature_eau: null });
  });

  test("laisse intacte une valeur numérique réellement fournie", async () => {
    const model = makeFakeModel({
      profondeur_max: { type: { key: "INTEGER" } },
    });
    const repo = new BaseRepository(model);
    await repo.create({ profondeur_max: 20 });
    expect(model.create).toHaveBeenCalledWith({ profondeur_max: 20 });
  });

  test("ne touche pas un champ texte laissé vide (ex. STRING)", async () => {
    const model = makeFakeModel({ lieu: { type: { key: "STRING" } } });
    const repo = new BaseRepository(model);
    await repo.create({ lieu: "" });
    expect(model.create).toHaveBeenCalledWith({ lieu: "" });
  });

  test("s'applique aussi sur update", async () => {
    const model = makeFakeModel({ id_seance: { type: { key: "INTEGER" } } });
    const instanceUpdate = jest.fn(async (data) => data);
    model.findByPk = jest.fn().mockResolvedValue({ update: instanceUpdate });
    const repo = new BaseRepository(model);
    await repo.update(1, { id_seance: "" });
    expect(instanceUpdate).toHaveBeenCalledWith({ id_seance: null }, {});
  });
});
