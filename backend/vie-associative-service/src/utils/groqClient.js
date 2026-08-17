// Validation automatique de la cohérence des documents soumis par un
// adhérent (licence FFESM/assurance, certificat médical), via l'API Groq
// (gratuite, cloud) — remplace la validation manuelle du président/
// trésorier pour ce circuit précis (voir AdhesionService.
// judgeSubmittedDocument / CertificatMedicalService.judgeSubmittedDocument).
// Choisie plutôt qu'Ollama en local : pas d'installation/de modèle à
// télécharger sur chaque poste, API compatible OpenAI (chat/completions),
// clé gratuite sans carte bancaire sur console.groq.com.
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const TIMEOUT_MS = 30000;

function buildPrompt({ typeDocument, champsAttendus, texteOcr, avertissementsHeuristiques }) {
  const champsTexte = Object.entries(champsAttendus)
    .filter(([, valeur]) => valeur !== null && valeur !== undefined && valeur !== "")
    .map(([champ, valeur]) => `- ${champ} : ${valeur}`)
    .join("\n");

  const avertissementsTexte = avertissementsHeuristiques.length
    ? avertissementsHeuristiques.map((a) => `- ${a}`).join("\n")
    : "(aucun)";

  return `Tu es le contrôle qualité automatisé d'un club de plongée associatif. Un adhérent a soumis un document "${typeDocument}" (photo ou scan) pour son dossier. Aucun humain ne relit ce document après toi : ta décision est définitive.

Informations saisies par l'adhérent dans le formulaire :
${champsTexte || "(aucune)"}

Texte détecté par OCR sur le document envoyé :
"""
${(texteOcr || "").trim().slice(0, 4000) || "(aucun texte détecté)"}
"""

Une première vérification automatique (comparaison texte simple, moins fiable que toi) a relevé ces points d'attention :
${avertissementsTexte}

Détermine si ce document semble authentique et cohérent avec les informations saisies (nom, dates, numéro de licence si applicable). Un scan flou ou mal cadré dont l'OCR est pauvre ne doit pas être rejeté seulement pour ça si les informations clés qui sont lisibles concordent. Rejette si le nom ne correspond clairement pas, si les dates sont manifestement incohérentes (ex. date de fin antérieure à la date de début, document expiré), ou si le document ne ressemble manifestement pas au type attendu.

Réponds UNIQUEMENT avec un objet JSON de cette forme exacte, sans aucun texte autour :
{"decision": "Validé" ou "Rejeté", "motif": "une phrase courte expliquant la décision"}`;
}

// Politique : Groq est le validateur normal de ce circuit (nom/dates/type
// de document jugés incohérents => rejet automatique, motif explicite). Mais
// une INDISPONIBILITÉ de Groq lui-même (clé API manquante, injoignable,
// timeout, réponse mal formée) n'est pas un jugement sur le document — donc
// pas un rejet. Elle bascule sur "En attente" : la soumission rejoint la
// file de validation manuelle du président/trésorier (validerAdhesion/
// validerCertificat), exactement comme avant l'introduction de ce circuit
// automatisé. Seule une vraie incohérence détectée par Groq (réponse reçue
// et exploitable) aboutit à un rejet.
async function judgeDocumentCoherence({
  typeDocument,
  champsAttendus,
  texteOcr,
  avertissementsHeuristiques = [],
}) {
  if (!process.env.GROQ_API_KEY) {
    return {
      decision: "En attente",
      motif: "Vérification automatique indisponible (clé API manquante) — en attente d'une validation manuelle.",
      source: "groq-no-key",
    };
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
        messages: [
          {
            role: "user",
            content: buildPrompt({ typeDocument, champsAttendus, texteOcr, avertissementsHeuristiques }),
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      throw new Error(`Groq a répondu ${response.status} ${errorBody.slice(0, 200)}`);
    }

    const body = await response.json();
    const parsed = JSON.parse(body.choices[0].message.content);
    const decision = parsed.decision === "Validé" ? "Validé" : "Rejeté";
    const motif =
      typeof parsed.motif === "string" && parsed.motif.trim()
        ? parsed.motif.trim()
        : decision === "Rejeté"
          ? "Document jugé non conforme par le contrôle automatique."
          : null;

    return { decision, motif, source: "groq" };
  } catch (error) {
    return {
      decision: "En attente",
      motif: `Vérification automatique indisponible (${error.message}) — en attente d'une validation manuelle.`,
      source: "groq-unreachable",
    };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { judgeDocumentCoherence };
