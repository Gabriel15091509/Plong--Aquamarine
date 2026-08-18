const { askAssistant, MESSAGE_INDISPONIBLE } = require("../src/utils/groqClient");
const AssistantService = require("../src/services/AssistantService");

const baseUser = { name: "Jean Dupont", role: "adherent" };

describe("groqClient.askAssistant — indisponibilité de Groq", () => {
  const originalKey = process.env.GROQ_API_KEY;
  const originalFetch = global.fetch;

  afterEach(() => {
    process.env.GROQ_API_KEY = originalKey;
    global.fetch = originalFetch;
  });

  test("renvoie le message de repli si la clé API est absente", async () => {
    delete process.env.GROQ_API_KEY;
    const result = await askAssistant({ systemPrompt: "x", history: [{ role: "user", content: "salut" }] });
    expect(result.reply).toBe(MESSAGE_INDISPONIBLE);
    expect(result.source).toBe("groq-no-key");
  });

  test("renvoie le message de repli si Groq est injoignable", async () => {
    process.env.GROQ_API_KEY = "test-key";
    global.fetch = jest.fn().mockRejectedValue(new Error("network down"));
    const result = await askAssistant({ systemPrompt: "x", history: [{ role: "user", content: "salut" }] });
    expect(result.reply).toBe(MESSAGE_INDISPONIBLE);
    expect(result.source).toBe("groq-unreachable");
  });

  test("renvoie le message de repli si Groq répond en erreur HTTP", async () => {
    process.env.GROQ_API_KEY = "test-key";
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500, text: async () => "internal error" });
    const result = await askAssistant({ systemPrompt: "x", history: [{ role: "user", content: "salut" }] });
    expect(result.reply).toBe(MESSAGE_INDISPONIBLE);
    expect(result.source).toBe("groq-unreachable");
  });

  test("renvoie la réponse de Groq quand il répond correctement", async () => {
    process.env.GROQ_API_KEY = "test-key";
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "Pour vous inscrire, allez sur la fiche de la sortie." } }] }),
    });
    const result = await askAssistant({ systemPrompt: "x", history: [{ role: "user", content: "comment je m'inscris ?" }] });
    expect(result.reply).toBe("Pour vous inscrire, allez sur la fiche de la sortie.");
    expect(result.source).toBe("groq");
  });
});

describe("AssistantService.chat", () => {
  const originalFetch = global.fetch;
  const originalKey = process.env.GROQ_API_KEY;

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.GROQ_API_KEY = originalKey;
  });

  test("rejette une conversation vide", async () => {
    const service = new AssistantService();
    await expect(service.chat(baseUser, [])).rejects.toThrow();
  });

  test("rejette une conversation qui ne se termine pas par un message utilisateur", async () => {
    const service = new AssistantService();
    await expect(
      service.chat(baseUser, [{ role: "assistant", content: "Bonjour !" }]),
    ).rejects.toThrow();
  });

  test("tronque l'historique à MAX_HISTORY messages et n'envoie que role/content", async () => {
    process.env.GROQ_API_KEY = "test-key";
    let sentBody;
    global.fetch = jest.fn().mockImplementation((url, options) => {
      sentBody = JSON.parse(options.body);
      return Promise.resolve({ ok: true, json: async () => ({ choices: [{ message: { content: "ok" } }] }) });
    });

    const longHistory = Array.from({ length: 20 }, (_, i) => ({
      role: i % 2 === 0 ? "user" : "assistant",
      content: `message ${i}`,
      extraChampInattendu: "ignoré",
    }));
    // S'assure que le dernier message reste bien "user" après troncature.
    longHistory.push({ role: "user", content: "dernière question" });

    const service = new AssistantService();
    const result = await service.chat(baseUser, longHistory);

    expect(result.reply).toBe("ok");
    // system prompt + 12 derniers messages max
    expect(sentBody.messages.length).toBeLessThanOrEqual(13);
    expect(sentBody.messages[0].role).toBe("system");
    expect(sentBody.messages[sentBody.messages.length - 1]).toEqual({
      role: "user",
      content: "dernière question",
    });
  });
});
