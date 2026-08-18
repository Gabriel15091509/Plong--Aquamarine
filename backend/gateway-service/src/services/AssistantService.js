const { askAssistant } = require("../utils/groqClient");
const { ValidationError } = require("../utils/errors");

// Fenêtre de contexte bornée : évite qu'une conversation qui s'éternise ne
// fasse grossir indéfiniment le prompt envoyé à Groq (coût + latence).
const MAX_HISTORY = 12;
const MAX_MESSAGE_LENGTH = 2000;

const PRESENTATION_PAR_ROLE = {
  president:
    "un président de club, avec accès à la gestion complète (adhérents, sorties, formations, finances, matériel).",
  moniteur:
    "un moniteur/encadrant, qui gère des sorties, valide des plongées et anime des formations.",
  tresorier: "un trésorier, qui gère les paiements et cotisations du club.",
  adherent:
    "un adhérent plongeur, qui consulte son profil, s'inscrit à des sorties et suit son carnet de plongée.",
};

function buildSystemPrompt(user) {
  const presentation = PRESENTATION_PAR_ROLE[user?.role] || "un utilisateur de l'application.";

  return `Tu es l'assistant intégré de "Plongée Club", une application de gestion pour un club de plongée associatif. Tu aides les utilisateurs à s'orienter dans l'application et à comprendre son fonctionnement.

L'utilisateur actuel s'appelle ${user?.name || "un utilisateur"} et c'est ${presentation}

Fonctionnalités principales, organisées par menu :
- Sorties : consulter les sorties plongée planifiées, s'inscrire ou envoyer une demande, voir "Mes sorties" (menu Sorties > Mes sorties), consulter la ou les palanquées et leurs responsables (moniteur encadrant, guide de palanquée, secouriste) sur la fiche détail d'une sortie.
- Plongées : le carnet de plongée (profondeur, durée, palanquée, moniteur encadrant) accessible depuis une sortie.
- Formations : suivi des niveaux, séances, validation par un moniteur.
- Adhésion / Certificat médical : dossier d'adhésion annuel (licence FFESM/assurance) et certificat médical, à téléverser puis validés (automatiquement ou par le président/trésorier).
- Paiements / Échéanciers : suivi des cotisations et paiements.
- Matériel : gestion du matériel du club et des réparations.
- Incidents : déclaration d'incidents lors d'une sortie.
- Alertes : notifications (expiration de certificat/adhésion, validation en attente...), signalées par un badge sur le menu concerné.

Règles importantes :
- Réponds en français, de façon brève, claire et concrète (indique le menu ou la page à utiliser quand c'est pertinent).
- Réponds en texte brut, sans Markdown (pas de **gras**, pas de #titres) : l'interface qui affiche ta réponse ne l'interprète pas. Pour une liste d'étapes, utilise des tirets ou une numérotation simple ("1.", "2.", ...) sur des lignes séparées.
- Tu n'as PAS accès aux données personnelles en direct de l'utilisateur (ses sorties, son solde, ses plongées, etc.) : si la question porte sur SES données précises, explique-le et indique où les consulter dans l'application, sans jamais inventer de valeur.
- Ne donne aucun conseil de sécurité plongée qui contredirait un encadrant réel ou les règles fédérales (FFESM/PADI) ; en cas de doute médical ou de sécurité, renvoie vers un moniteur ou un médecin.
- Si la question est hors sujet (rien à voir avec le club ou l'application), réponds brièvement puis recentre poliment sur ce que tu peux faire.`;
}

function sanitizeHistory(rawHistory) {
  if (!Array.isArray(rawHistory)) return [];

  return rawHistory
    .filter(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim(),
    )
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role, content: m.content.trim().slice(0, MAX_MESSAGE_LENGTH) }));
}

class AssistantService {
  async chat(user, rawHistory) {
    const history = sanitizeHistory(rawHistory);
    if (history.length === 0 || history[history.length - 1].role !== "user") {
      throw new ValidationError("Aucun message utilisateur à traiter");
    }

    const systemPrompt = buildSystemPrompt(user);
    const { reply, source } = await askAssistant({ systemPrompt, history });
    return { reply, source };
  }
}

module.exports = AssistantService;
