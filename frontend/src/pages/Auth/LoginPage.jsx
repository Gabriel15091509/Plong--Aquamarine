import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiLogIn,
  FiLogOut,
  FiShield,
  FiCreditCard,
  FiDroplet,
  FiAnchor,
  FiCompass,
  FiArrowRight,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import Logo from "../../components/Common/Logo";

// Libellés de rôle courts, cohérents avec Sidebar.jsx (footer profil).
const ROLE_LABELS = {
  president: "Président",
  moniteur: "Moniteur",
  tresorier: "Trésorier",
  adherent: "Adhérent",
};

const LoginPage = () => {
  const navigate = useNavigate();
  const { user, login, verifyOtp, logout } = useAuth();
  // Revenir en arrière (bouton précédent du navigateur) vers /login alors
  // que la session est toujours valide (token en localStorage, jamais
  // effacé) affichait jusqu'ici le formulaire de connexion vide, sans rien
  // dire de la session existante — confus ("suis-je connecté ou non ?").
  // On propose maintenant explicitement de continuer vers l'espace déjà
  // ouvert, ou de se déconnecter pour vider la session (ex. changer de
  // compte sur le même appareil).
  const alreadyLoggedIn = Boolean(user);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false,
  });
  const [errors, setErrors] = useState({});
  const [otpEmail, setOtpEmail] = useState(null);
  const [otpCode, setOtpCode] = useState("");
  // Après connexion, les deux parties de la carte s'écartent comme des
  // battants qui s'ouvrent (gauche vers la gauche, droite vers la droite)
  // pour faire place au tableau de bord, qui s'ouvre ensuite avec sa
  // propre animation d'entrée habituelle.
  const [transitioning, setTransitioning] = useState(false);
  const LOGIN_TRANSITION_MS = 500;

  const goToDashboardWithTransition = () => {
    setTransitioning(true);
    setTimeout(() => {
      navigate("/dashboard");
    }, LOGIN_TRANSITION_MS);
  };

  // Animations variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04,
        delayChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.25, ease: "easeOut" },
    },
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email invalide";
    }
    if (!formData.password) {
      newErrors.password = "Le mot de passe est requis";
    } else if (formData.password.length < 6) {
      newErrors.password =
        "Le mot de passe doit contenir au moins 6 caractères";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    let navigating = false;

    try {
      const result = await login(formData.email, formData.password);

      if (result?.otpRequired) {
        setOtpEmail(result.email);
        return;
      }

      if (result?.mustChangePassword) {
        navigating = true;
        navigate("/change-password", { state: { fromLogin: true } });
      } else {
        navigating = true;
        goToDashboardWithTransition();
      }
    } catch (error) {
      // toast.error déjà géré dans AuthContext.login()
    } finally {
      // On laisse le bouton en état "chargement" pendant la transition vers
      // le tableau de bord plutôt que de le faire clignoter avant la
      // navigation (le composant sera de toute façon démonté juste après).
      if (!navigating) setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    let navigating = false;

    try {
      const result = await verifyOtp(otpEmail, otpCode);

      if (result?.mustChangePassword) {
        navigating = true;
        navigate("/change-password", { state: { fromLogin: true } });
      } else {
        navigating = true;
        goToDashboardWithTransition();
      }
    } catch (error) {
      // toast.error déjà géré dans AuthContext.verifyOtp()
    } finally {
      if (!navigating) setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-ocean-50 flex items-center justify-center p-4 overflow-hidden relative dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Formes d'arrière-plan (statiques, discrètes) */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-primary-200/20 rounded-full blur-2xl dark:bg-primary-900/20 pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-ocean-200/20 rounded-full blur-2xl dark:bg-ocean-900/20 pointer-events-none" />

      {/* Aperçu du tableau de bord : apparaît en fondu dès que les battants
          commencent à s'écarter, pour que le dashboard se révèle
          progressivement derrière la carte plutôt que de rester caché
          derrière le fond de la page de connexion jusqu'à la navigation. */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: transitioning ? 1 : 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="absolute inset-0 z-10 flex overflow-hidden bg-gray-50 dark:bg-gray-900 pointer-events-none"
      >
        <div className="hidden md:block w-56 shrink-0 h-full bg-white dark:bg-gray-800 border-r border-cyan-100/50 dark:border-cyan-800/30 p-4 space-y-3">
          <div className="h-9 w-28 rounded-lg bg-gray-100 dark:bg-gray-700 animate-pulse" />
          <div className="h-8 rounded-xl bg-cyan-50 dark:bg-cyan-900/30 animate-pulse" />
          <div className="h-8 rounded-xl bg-gray-100 dark:bg-gray-700/60 animate-pulse" />
          <div className="h-8 rounded-xl bg-gray-100 dark:bg-gray-700/60 animate-pulse" />
          <div className="h-8 rounded-xl bg-gray-100 dark:bg-gray-700/60 animate-pulse" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="h-14 flex items-center justify-between px-6 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
            <div className="h-4 w-32 rounded bg-gray-100 dark:bg-gray-700 animate-pulse" />
            <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 animate-pulse" />
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 animate-pulse"
                />
              ))}
            </div>
            <div className="h-40 rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 animate-pulse" />
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={
          transitioning
            ? { opacity: 0, scale: 1.02 }
            : { opacity: 1, y: 0, scale: 1 }
        }
        transition={
          transitioning
            ? { duration: 0.4, ease: "easeOut" }
            : { duration: 0.3, ease: "easeOut" }
        }
        // 2/3 de la largeur d'écran sur ordinateur (md+), quelle que soit sa
        // taille réelle (petit laptop ou grand moniteur) — réduit depuis
        // 4/5, jugé trop large. Pleine largeur conservée en dessous de md
        // (mobile) : 2/3 y serait trop étroit pour le formulaire.
        className="relative z-20 w-full md:w-2/3 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-white/20 dark:bg-gray-800/95 dark:border-gray-700/50"
      >
        {/* Découvrir le club - mobile uniquement : le bouton équivalent vit
            dans le volet de marque (photo à droite), qui est "hidden
            md:flex" — invisible en mobile, où seul le formulaire s'affiche.
            Repris ici en haut à droite de la carte, sans la photo derrière,
            donc un style plus discret (fond clair) plutôt que le bouton
            plein blanc sur fond sombre du volet desktop. */}
        {!transitioning && (
          <Link
            to="/decouvrir"
            className="md:hidden absolute top-4 right-4 z-30 inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-semibold rounded-full shadow-sm border border-primary-100 dark:border-primary-800/40"
          >
            <FiCompass className="w-3.5 h-3.5" />
            Découvrir le club
          </Link>
        )}

        {/* Partie gauche - Formulaire */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={transitioning ? { opacity: 0, x: "-100%" } : "visible"}
          transition={transitioning ? { duration: 0.4, ease: "easeIn" } : undefined}
          className="w-full md:w-1/2 p-8 md:p-12 lg:p-16 dark:bg-gray-800/50"
        >
          {/* Logo */}
          <motion.div variants={itemVariants} className="flex items-center gap-3 mb-8">
            <Logo size="lg" />
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-ocean-600 bg-clip-text text-transparent dark:from-primary-400 dark:to-ocean-400">
                Plongée Club
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Gestion de club de plongée
              </p>
            </div>
          </motion.div>

          {/* Titre */}
          <motion.div variants={itemVariants} className="mb-8">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
              {alreadyLoggedIn ? "Déjà connecté" : otpEmail ? "Vérification" : "Connexion"}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              {alreadyLoggedIn
                ? `Vous êtes toujours connecté(e) en tant que ${user.name}.`
                : otpEmail
                  ? `Saisissez le code envoyé à ${otpEmail}`
                  : "Connectez-vous pour accéder à votre espace de gestion"}
            </p>
          </motion.div>

          {alreadyLoggedIn ? (
            /* Session encore valide (retour arrière du navigateur, onglet
               resté ouvert...) : proposer de continuer plutôt que de se
               reconnecter par-dessus, ou de se déconnecter explicitement
               pour vider la session (ex. changer de compte). */
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-6"
            >
              <motion.div
                variants={itemVariants}
                className="flex items-center gap-3 p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800/40"
              >
                <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {user.name?.charAt(0) || "?"}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {ROLE_LABELS[user.role] || user.role}
                  </p>
                </div>
              </motion.div>

              <motion.div variants={itemVariants}>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  className="w-full py-3 bg-gradient-to-r from-primary-500 to-ocean-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <FiArrowRight className="w-5 h-5" />
                  Continuer vers mon espace
                </motion.button>
              </motion.div>

              <motion.div variants={itemVariants}>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="button"
                  onClick={logout}
                  className="w-full py-3 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 rounded-xl font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <FiLogOut className="w-5 h-5" />
                  Se déconnecter
                </motion.button>
              </motion.div>
            </motion.div>
          ) : otpEmail ? (
            /* Étape 2 : code OTP (authentification renforcée président) */
            <motion.form
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              onSubmit={handleVerifyOtp}
              className="space-y-6"
            >
              <motion.div variants={itemVariants}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Code à usage unique
                </label>
                <div className="relative">
                  <FiShield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) =>
                      setOtpCode(e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="123456"
                    autoFocus
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300 bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 tracking-[0.5em] text-center text-xl font-mono"
                  />
                </div>
              </motion.div>

              <motion.div variants={itemVariants}>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={loading || otpCode.length !== 6}
                  className="w-full py-3 bg-gradient-to-r from-primary-500 to-ocean-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? "Vérification..." : "Valider"}
                </motion.button>
              </motion.div>

              <motion.button
                type="button"
                variants={itemVariants}
                onClick={() => {
                  setOtpEmail(null);
                  setOtpCode("");
                }}
                className="w-full text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                ← Retour à la connexion
              </motion.button>
            </motion.form>
          ) : (
          /* Formulaire */
          <motion.form
            variants={containerVariants}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* Email */}
            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Adresse email
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="exemple@email.com"
                  className={`w-full pl-10 pr-4 py-3 border ${
                    errors.email
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  } rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300 bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400`}
                />
              </div>
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-1 text-sm text-red-600 dark:text-red-400"
                >
                  {errors.email}
                </motion.p>
              )}
            </motion.div>

            {/* Mot de passe */}
            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-12 py-3 border ${
                    errors.password
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  } rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300 bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                >
                  {showPassword ? (
                    <FiEyeOff className="w-5 h-5" />
                  ) : (
                    <FiEye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-1 text-sm text-red-600 dark:text-red-400"
                >
                  {errors.password}
                </motion.p>
              )}
            </motion.div>

            {/* Options */}
            <motion.div
              variants={itemVariants}
              className="flex items-center justify-between"
            >
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="remember"
                  checked={formData.remember}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-600 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500 dark:bg-gray-700 dark:checked:bg-primary-500"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Se souvenir de moi
                </span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium transition-colors"
              >
                Mot de passe oublié ?
              </Link>
            </motion.div>

            {/* Bouton de connexion */}
            <motion.div variants={itemVariants}>
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
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                    Connexion en cours...
                  </>
                ) : (
                  <>
                    <FiLogIn className="w-5 h-5" />
                    Se connecter
                  </>
                )}
              </motion.button>
            </motion.div>
          </motion.form>
          )}

          {/* Footer */}
          <motion.div variants={itemVariants} className="mt-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              © 2024 Plongée Club. Tous droits réservés.
            </p>
            <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-400 dark:text-gray-500">
              {[
                { Icon: FiLock, text: "Connexion sécurisée" },
                { Icon: FiCreditCard, text: "Paiement sécurisé" },
                { Icon: FiShield, text: "Protection des données" },
              ].map((item, index) => (
                <span key={index} className="flex items-center gap-1">
                  <item.Icon className="w-3.5 h-3.5" /> {item.text}
                </span>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Partie droite - Logo sur fond de marque */}
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={
            transitioning ? { opacity: 0, x: "100%" } : { opacity: 1, x: 0 }
          }
          transition={
            transitioning
              ? { duration: 0.4, ease: "easeIn" }
              : { duration: 0.3, delay: 0.1, ease: "easeOut" }
          }
          className="hidden md:flex w-1/2 relative bg-primary-900 p-8 overflow-hidden items-center justify-center"
        >
          {/* Photo de fond (plongeur en eau bleue) : remplace l'ancien
              aplat "tout dégradé" par une image de notre domaine, plus
              proche d'un site vitrine que d'un simple fond de couleur —
              même photo/traitement que le hero de AboutPage.jsx. */}
          <img
            src="https://images.unsplash.com/photo-1761145586920-8eb35f3c7c9b?w=1600&q=75&auto=format&fit=crop"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Voile dégradé aux couleurs de la marque, pour garder le logo et
              le texte lisibles par-dessus la photo. */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-900/85 via-primary-800/75 to-ocean-900/85" />

          {/* Vague décorative (statique) */}
          <div className="absolute inset-0">
            <svg
              className="absolute bottom-0 w-full"
              viewBox="0 0 1440 320"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                fill="rgba(255,255,255,0.05)"
              />
            </svg>
          </div>

          {/* Découvrir le club : mis en évidence en haut à droite, visible
              sans avoir à se connecter (voir PublicAboutPage.jsx). Bouton
              plein (blanc/opaque) plutôt qu'un lien discret, pour qu'il
              ressorte nettement sur la photo. */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2, ease: "easeOut" }}
            className="absolute top-6 right-6 z-20"
          >
            <Link
              to="/decouvrir"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-primary-700 text-sm font-semibold rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-100 transition-all duration-200"
            >
              <FiCompass className="w-4 h-4" />
              Découvrir le club
            </Link>
          </motion.div>

          {/* Logo au centre */}
          <div className="relative z-10 flex flex-col items-center justify-center h-full">
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.15, ease: "easeOut" }}
              className="relative w-80 h-80 mx-auto -mt-8 flex items-center justify-center"
            >
              <motion.div
                animate={{ scale: [1, 1.08, 1], opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-4 bg-white/20 rounded-full blur-2xl"
              />
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                className="relative"
              >
                <Logo size="xl" className="w-64 h-64" />
              </motion.div>

              {/* Icônes décoratives, flottement discret */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-1 -right-1 bg-white/20 backdrop-blur-sm p-2 rounded-full border border-white/20"
              >
                <FiDroplet className="w-4 h-4 text-white" />
              </motion.div>
              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -bottom-1 -left-1 bg-white/20 backdrop-blur-sm p-2 rounded-full border border-white/20"
              >
                <FiAnchor className="w-4 h-4 text-white" />
              </motion.div>
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute top-1/2 -left-3 bg-white/20 backdrop-blur-sm p-2 rounded-full border border-white/20"
              >
                <FiCompass className="w-4 h-4 text-white" />
              </motion.div>
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                className="absolute top-1/2 -right-3 bg-white/20 backdrop-blur-sm p-2 rounded-full border border-white/20"
              >
                <FiShield className="w-4 h-4 text-white" />
              </motion.div>
            </motion.div>

            {/* Texte de bienvenue : même langage de badge/typo que le hero
                de AboutPage.jsx (pastille verre dépoli + titre large en
                drop-shadow, pour rester lisible sur la photo). */}
            <motion.div
              className="text-center mt-6 px-6"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.25, ease: "easeOut" }}
            >
              <span className="inline-block px-3 py-1 mb-3 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full text-[11px] font-semibold uppercase tracking-widest text-white/90">
                Aquanature Plongée
              </span>
              <h2 className="text-4xl font-bold text-white mb-3 tracking-tight text-balance drop-shadow-sm">
                Bienvenue dans le club
              </h2>
              <p className="text-white/80 text-base leading-relaxed max-w-xs mx-auto">
                Gérez vos adhérents, sorties et plongées facilement
              </p>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
