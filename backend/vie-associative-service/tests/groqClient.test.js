const { judgeDocumentCoherence } = require("../src/utils/groqClient");

const baseArgs = {
  typeDocument: "FFESM",
  champsAttendus: { nom: "Dupont", prenom: "Jean" },
  texteOcr: "Licence FFESM Jean Dupont",
  avertissementsHeuristiques: [],
};

describe("groqClient.judgeDocumentCoherence — indisponibilité de Groq", () => {
  const originalKey = process.env.GROQ_API_KEY;
  const originalFetch = global.fetch;

  afterEach(() => {
    process.env.GROQ_API_KEY = originalKey;
    global.fetch = originalFetch;
  });

  test('bascule sur "En attente" (pas "Rejeté") si la clé API est absente', async () => {
    delete process.env.GROQ_API_KEY;
    const result = await judgeDocumentCoherence(baseArgs);
    expect(result.decision).toBe("En attente");
    expect(result.source).toBe("groq-no-key");
  });

  test('bascule sur "En attente" (pas "Rejeté") si Groq est injoignable', async () => {
    process.env.GROQ_API_KEY = "test-key";
    global.fetch = jest.fn().mockRejectedValue(new Error("network down"));
    const result = await judgeDocumentCoherence(baseArgs);
    expect(result.decision).toBe("En attente");
    expect(result.source).toBe("groq-unreachable");
  });

  test('bascule sur "En attente" (pas "Rejeté") si Groq répond en erreur HTTP', async () => {
    process.env.GROQ_API_KEY = "test-key";
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "internal error",
    });
    const result = await judgeDocumentCoherence(baseArgs);
    expect(result.decision).toBe("En attente");
    expect(result.source).toBe("groq-unreachable");
  });

  test("respecte le jugement de Groq (Validé) quand il répond correctement", async () => {
    process.env.GROQ_API_KEY = "test-key";
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify({ decision: "Validé", motif: null }) } }],
      }),
    });
    const result = await judgeDocumentCoherence(baseArgs);
    expect(result.decision).toBe("Validé");
    expect(result.source).toBe("groq");
  });

  test("respecte le jugement de Groq (Rejeté) quand il répond correctement", async () => {
    process.env.GROQ_API_KEY = "test-key";
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({ decision: "Rejeté", motif: "Nom incohérent" }),
            },
          },
        ],
      }),
    });
    const result = await judgeDocumentCoherence(baseArgs);
    expect(result.decision).toBe("Rejeté");
    expect(result.motif).toBe("Nom incohérent");
    expect(result.source).toBe("groq");
  });
});
