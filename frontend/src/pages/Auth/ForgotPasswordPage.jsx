import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FiMail, FiArrowLeft, FiSend, FiCheckCircle } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import Logo from "../../components/Common/Logo";

// Étape 1 du flux "Mot de passe oublié ?" (lien de LoginPage.jsx, resté un
// lien mort href="#" jusqu'ici) : demande l'email, envoie un lien de
// réinitialisation à usage unique. Même habillage (fond dégradé, carte
// arrondie, logo) que LoginPage.jsx pour rester cohérent, mais sans le
// volet de marque à droite — page secondaire, traitement plus simple.
const ForgotPasswordPage = () => {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("L'email est requis");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await forgotPassword(email);
      // Le backend répond toujours le même message générique (compte
      // trouvé ou non) : on passe systématiquement à l'état "envoyé",
      // jamais d'erreur affichée ici sur une simple absence de compte.
      setSent(true);
    } catch {
      setError("Une erreur est survenue, réessayez dans un instant");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-ocean-50 flex items-center justify-center p-4 overflow-hidden relative dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="absolute top-10 left-10 w-32 h-32 bg-primary-200/20 rounded-full blur-2xl dark:bg-primary-900/20 pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-ocean-200/20 rounded-full blur-2xl dark:bg-ocean-900/20 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20 dark:bg-gray-800/95 dark:border-gray-700/50 p-8 md:p-12"
      >
        <div className="flex items-center gap-3 mb-8">
          <Logo size="lg" />
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-ocean-600 bg-clip-text text-transparent dark:from-primary-400 dark:to-ocean-400">
              Plongée Club
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Gestion de club de plongée
            </p>
          </div>
        </div>

        {sent ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="text-center py-4"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-50 dark:bg-primary-900/20 mb-5">
              <FiCheckCircle className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
              Email envoyé
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Si un compte existe avec l&apos;adresse{" "}
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {email}
              </span>
              , un lien de réinitialisation vient de lui être envoyé.
              Vérifiez aussi vos courriers indésirables.
            </p>
          </motion.div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
                Mot de passe oublié
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                Indiquez votre email, nous vous envoyons un lien pour choisir
                un nouveau mot de passe.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Adresse email
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder="exemple@email.com"
                    autoFocus
                    className={`w-full pl-10 pr-4 py-3 border ${
                      error ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                    } rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300 bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400`}
                  />
                </div>
                {error && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
                )}
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-primary-500 to-ocean-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <FiSend className="w-5 h-5" />
                    Envoyer le lien
                  </>
                )}
              </motion.button>
            </form>
          </>
        )}

        <div className="mt-8 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <FiArrowLeft className="w-4 h-4" />
            Retour à la connexion
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
