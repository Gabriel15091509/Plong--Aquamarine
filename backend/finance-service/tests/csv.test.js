const { buildCsv } = require("../src/utils/csv");

describe("buildCsv", () => {
  test("génère un en-tête et des lignes séparés par ;", () => {
    const csv = buildCsv(["A", "B"], [["1", "2"]]);
    expect(csv).toContain("A;B");
    expect(csv).toContain("1;2");
  });

  test("préfixe le contenu d'un BOM UTF-8", () => {
    const csv = buildCsv(["A"], [["1"]]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
  });

  test("entoure de guillemets un champ contenant le séparateur", () => {
    const csv = buildCsv(["A"], [["valeur;avec;point-virgule"]]);
    expect(csv).toContain('"valeur;avec;point-virgule"');
  });

  test("double les guillemets internes", () => {
    const csv = buildCsv(["A"], [['il dit "bonjour"']]);
    expect(csv).toContain('"il dit ""bonjour"""');
  });

  test("remplace une valeur null/undefined par une chaîne vide", () => {
    const csv = buildCsv(["A", "B"], [[null, undefined]]);
    expect(csv).toContain("\r\n;");
  });
});
