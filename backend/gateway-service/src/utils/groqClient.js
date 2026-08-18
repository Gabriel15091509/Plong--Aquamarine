// Assistant conversationnel (API Groq, gratuite) pour aider les utilisateurs
// à s'orienter dans l'application — "comment m'inscrire à une sortie ?",
// "où voir mon carnet de plongée ?", etc. Même fournisseur et même motif que
// backend/vie-associative-service/src/utils/groqClient.js (validation de
// documents) : API compatible OpenAI (chat/completions), clé gratuite sans
// carte bancaire sur console.groq.com, pas d'installation locale contrairement
// à Ollama.
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
// "llama-3.3-70b-versatile" a été retiré du catalogue Groq (404
// model_not_found, constaté le 2026-08-18) — "groq/compound-mini" est un
// modèle "agentique" composite maintenu par Groq (route en interne vers
// llama-3.3-70b-versatile / gpt-oss-120b) qui renvoie un `content` propre,
// contrairement aux modèles "reasoning" bruts (gpt-oss-*, qwen3.6-*) dont la
// réponse arrive dans un champ `reasoning` séparé ou avec des balises
// <think> imbriquées dans `content`.
const GROQ_MODEL = process.env.GROQ_MODEL || "groq/compound-mini";
const TIMEOUT_MS = 20000;

const MESSAGE_INDISPONIBLE =
  "Désolé, l'assistant est momentanément indisponible. Vous pouvez consulter les pages du menu ou contacter le bureau du club.";

// Politique : contrairement au circuit de validation de documents (où
// l'indisponibilité de Groq bascule sur une file d'attente humaine), il n'y a
// personne à qui basculer une conversation — on renvoie donc directement un
// message de repli explicite plutôt que de faire planter la requête, que la
// cause soit une clé manquante, un timeout ou une réponse mal formée.
async function askAssistant({ systemPrompt, history }) {
  if (!process.env.GROQ_API_KEY) {
    return { reply: MESSAGE_INDISPONIBLE, source: "groq-no-key" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: "system", content: systemPrompt }, ...history],
        temperature: 0.4,
        max_tokens: 600,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      throw new Error(`Groq a répondu ${response.status} ${errorBody.slice(0, 200)}`);
    }

    const body = await response.json();
    const reply = body.choices?.[0]?.message?.content?.trim();
    if (!reply) throw new Error("Réponse Groq vide ou mal formée");

    return { reply, source: "groq" };
  } catch (error) {
    return { reply: MESSAGE_INDISPONIBLE, source: "groq-unreachable", error: error.message };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { askAssistant, MESSAGE_INDISPONIBLE };
