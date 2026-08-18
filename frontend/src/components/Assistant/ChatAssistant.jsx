import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiMessageCircle, FiX, FiSend, FiLoader } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import useAssistant from "../../hooks/Assistant/useAssistant";

// Rendu minimal : seul le **gras** Markdown est interprété (le modèle en
// produit malgré la consigne "texte brut" du prompt système côté backend —
// plus fiable de le rendre proprement ici que de compter sur le respect de
// l'instruction par le LLM). Tout le reste (listes, retours à la ligne) est
// déjà géré par `whitespace-pre-wrap` sur le conteneur du message.
const renderMessageContent = (content) => {
  const segments = content.split(/(\*\*[^*]+\*\*)/g);
  return segments.map((segment, i) => {
    if (segment.startsWith("**") && segment.endsWith("**")) {
      return <strong key={i}>{segment.slice(2, -2)}</strong>;
    }
    return <React.Fragment key={i}>{segment}</React.Fragment>;
  });
};

const MESSAGE_BIENVENUE = {
  role: "assistant",
  content:
    "Bonjour ! Je suis l'assistant de Plongée Club. Posez-moi vos questions sur l'utilisation de l'application (inscriptions, sorties, formations, carnet de plongée...).",
};

// Widget flottant, monté une seule fois dans Layout.jsx (donc disponible sur
// toutes les pages authentifiées) — l'historique vit dans le state du
// composant : il survit à la navigation (Layout ne se démonte pas entre les
// pages) mais repart à zéro à un rechargement complet, ce qui est le
// comportement attendu d'une conversation d'assistance ponctuelle.
const ChatAssistant = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([MESSAGE_BIENVENUE]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const { useChat } = useAssistant();
  const chatMutation = useChat();

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, chatMutation.isPending]);

  if (!user) return null;

  const handleSend = (e) => {
    e.preventDefault();
    const contenu = input.trim();
    if (!contenu || chatMutation.isPending) return;

    const historique = [...messages, { role: "user", content: contenu }];
    setMessages(historique);
    setInput("");

    // On envoie l'historique complet (hors message de bienvenue local, sans
    // valeur pour Groq) : c'est le backend (AssistantService) qui tronque à
    // la fenêtre de contexte réellement envoyée au modèle.
    chatMutation.mutate(
      historique.filter((m) => m !== MESSAGE_BIENVENUE),
      {
        onSuccess: (res) => {
          setMessages((prev) => [...prev, { role: "assistant", content: res.data.reply }]);
        },
        onError: (error) => {
          const message =
            error.response?.data?.message ||
            "Désolé, une erreur est survenue. Réessayez dans un instant.";
          setMessages((prev) => [...prev, { role: "assistant", content: message }]);
        },
      },
    );
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-16 right-0 w-[22rem] sm:w-96 h-[28rem] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col dark:bg-gray-800 dark:border-gray-700"
          >
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-ocean-600 to-primary-600 text-white shrink-0">
              <div className="flex items-center gap-2">
                <FiMessageCircle className="w-5 h-5" />
                <span className="font-semibold text-sm">Assistant Plongée Club</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-white/20 transition-colors"
                aria-label="Fermer l'assistant"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-gray-50 dark:bg-gray-900/40">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-primary-600 text-white rounded-br-sm"
                        : "bg-white text-gray-800 border border-gray-100 rounded-bl-sm dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                    }`}
                  >
                    {renderMessageContent(m.content)}
                  </div>
                </div>
              ))}

              {chatMutation.isPending && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] px-3 py-2 rounded-2xl rounded-bl-sm text-sm bg-white text-gray-500 border border-gray-100 flex items-center gap-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400">
                    <FiLoader className="w-3.5 h-3.5 animate-spin" />
                    En train d&apos;écrire...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form
              onSubmit={handleSend}
              className="p-3 border-t border-gray-100 bg-white flex items-center gap-2 shrink-0 dark:bg-gray-800 dark:border-gray-700"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Posez votre question..."
                maxLength={2000}
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
              />
              <button
                type="submit"
                disabled={!input.trim() || chatMutation.isPending}
                className="p-2 rounded-xl bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Envoyer"
              >
                <FiSend className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen((v) => !v)}
        className="w-14 h-14 rounded-full bg-gradient-to-br from-ocean-600 to-primary-600 text-white shadow-2xl flex items-center justify-center"
        aria-label={isOpen ? "Fermer l'assistant" : "Ouvrir l'assistant"}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isOpen ? (
            <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <FiX className="w-6 h-6" />
            </motion.span>
          ) : (
            <motion.span key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <FiMessageCircle className="w-6 h-6" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
};

export default ChatAssistant;
