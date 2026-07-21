import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiLogIn,
  FiUser,
  FiShield,
  FiDroplet,
  FiAnchor,
  FiCompass,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import Logo from "../../components/Common/Logo";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, verifyOtp } = useAuth();
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

  // Animations variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24,
      },
    },
  };

  const bubbleVariants = {
    animate: {
      y: [0, -20, 0],
      x: [0, 10, -10, 0],
      scale: [1, 1.1, 1],
      transition: {
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut",
      },
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

    try {
      const result = await login(formData.email, formData.password);

      if (result?.otpRequired) {
        setOtpEmail(result.email);
        return;
      }

      if (result?.mustChangePassword) {
        navigate("/change-password", { state: { fromLogin: true } });
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      // toast.error déjà géré dans AuthContext.login()
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await verifyOtp(otpEmail, otpCode);

      if (result?.mustChangePassword) {
        navigate("/change-password", { state: { fromLogin: true } });
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      // toast.error déjà géré dans AuthContext.verifyOtp()
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-ocean-50 flex items-center justify-center p-4 overflow-hidden relative dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Bulles d'arrière-plan animées */}
      <motion.div
        variants={bubbleVariants}
        animate="animate"
        className="absolute top-10 left-10 w-32 h-32 bg-primary-200/20 rounded-full blur-2xl dark:bg-primary-900/20"
      />
      <motion.div
        variants={bubbleVariants}
        animate="animate"
        className="absolute bottom-20 right-10 w-40 h-40 bg-ocean-200/20 rounded-full blur-2xl dark:bg-ocean-900/20"
        style={{ animationDelay: "2s" }}
      />
      <motion.div
        variants={bubbleVariants}
        animate="animate"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-300/5 rounded-full blur-3xl dark:bg-primary-900/10"
        style={{ animationDelay: "4s" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-6xl bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-white/20 dark:bg-gray-800/95 dark:border-gray-700/50"
      >
        {/* Partie gauche - Formulaire */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full md:w-1/2 p-8 md:p-12 lg:p-16 dark:bg-gray-800/50"
        >
          {/* Logo avec animation flottante */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3 mb-8"
          >
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Logo size="lg" />
            </motion.div>
            <div>
              <motion.h1
                className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-ocean-600 bg-clip-text text-transparent dark:from-primary-400 dark:to-ocean-400"
                whileHover={{ scale: 1.02 }}
              >
                Plongée Club
              </motion.h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Gestion de club de plongée
              </p>
            </div>
          </motion.div>

          {/* Titre avec animation */}
          <motion.div variants={itemVariants} className="mb-8">
            <motion.h2
              className="text-3xl font-bold text-gray-800 dark:text-white"
              whileHover={{ x: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {otpEmail ? "Vérification" : "Connexion"}
            </motion.h2>
            <motion.p
              className="text-gray-500 dark:text-gray-400 mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {otpEmail
                ? `Saisissez le code envoyé à ${otpEmail}`
                : "Connectez-vous pour accéder à votre espace de gestion"}
            </motion.p>
          </motion.div>

          {otpEmail ? (
            /* Étape 2 : code OTP (authentification renforcée président) */
            <motion.form
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              onSubmit={handleVerifyOtp}
              className="space-y-6"
            >
              <motion.div variants={itemVariants}>
                <motion.label
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  whileHover={{ x: 3 }}
                >
                  Code à usage unique
                </motion.label>
                <motion.div className="relative" whileFocus={{ scale: 1.01 }}>
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
                </motion.div>
              </motion.div>

              <motion.div variants={itemVariants}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
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
              <motion.label
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                whileHover={{ x: 3 }}
              >
                Adresse email
              </motion.label>
              <motion.div className="relative" whileFocus={{ scale: 1.01 }}>
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
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: formData.email ? 1 : 0 }}
                  className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-primary-500 to-ocean-500 rounded-full"
                  style={{ width: "100%", transformOrigin: "left" }}
                />
              </motion.div>
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 text-sm text-red-600 dark:text-red-400"
                >
                  {errors.email}
                </motion.p>
              )}
            </motion.div>

            {/* Mot de passe */}
            <motion.div variants={itemVariants}>
              <motion.label
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                whileHover={{ x: 3 }}
              >
                Mot de passe
              </motion.label>
              <motion.div className="relative" whileFocus={{ scale: 1.01 }}>
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
                <motion.button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {showPassword ? (
                    <FiEyeOff className="w-5 h-5" />
                  ) : (
                    <FiEye className="w-5 h-5" />
                  )}
                </motion.button>
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: formData.password ? 1 : 0 }}
                  className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-primary-500 to-ocean-500 rounded-full"
                  style={{ width: "100%", transformOrigin: "left" }}
                />
              </motion.div>
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
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
              <motion.label
                className="flex items-center gap-2 cursor-pointer"
                whileHover={{ scale: 1.02 }}
              >
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
              </motion.label>
              <motion.a
                href="#"
                className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Mot de passe oublié ?
              </motion.a>
            </motion.div>

            {/* Bouton de connexion */}
            <motion.div variants={itemVariants}>
              <motion.button
                whileHover={{
                  scale: 1.02,
                  boxShadow: "0 20px 60px rgba(37, 99, 235, 0.3)",
                }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-primary-500 to-ocean-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed relative overflow-hidden group"
              >
                <motion.div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-ocean-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10 flex items-center gap-2">
                  {loading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
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
                </span>
              </motion.button>
            </motion.div>
          </motion.form>
          )}

          {/* Footer */}
          <motion.div variants={itemVariants} className="mt-8 text-center">
            <motion.p
              className="text-sm text-gray-500 dark:text-gray-400"
              whileHover={{ scale: 1.02 }}
            >
              © 2024 Plongée Club. Tous droits réservés.
            </motion.p>
            <motion.div
              className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-400 dark:text-gray-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              {[
                { icon: "🔒", text: "Connexion sécurisée" },
                { icon: "💳", text: "Paiement sécurisé" },
                { icon: "🛡️", text: "Protection des données" },
              ].map((item, index) => (
                <motion.span
                  key={index}
                  className="flex items-center gap-1"
                  whileHover={{ scale: 1.05, color: "#2563eb" }}
                >
                  {item.icon} {item.text}
                </motion.span>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>

        {/* ✅ Partie droite - Logo sans fond */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          className="hidden md:block w-1/2 relative bg-gradient-to-br from-primary-600 via-primary-700 to-ocean-800 p-8 overflow-hidden flex items-center justify-center"
        >
          {/* Effets de fond */}
          <div className="absolute inset-0">
            <svg
              className="absolute bottom-0 w-full"
              viewBox="0 0 1440 320"
              xmlns="http://www.w3.org/2000/svg"
            >
              <motion.path
                initial={{
                  d: "M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z",
                }}
                animate={{
                  d: [
                    "M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z",
                    "M0,64L48,80C96,96,192,128,288,144C384,160,480,160,576,144C672,128,768,96,864,96C960,96,1056,128,1152,144C1248,160,1344,160,1392,160L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z",
                    "M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z",
                  ],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                fill="rgba(255,255,255,0.05)"
              />
            </svg>
          </div>

          {/* ✅ Logo sans fond au centre */}
          <div className="relative z-10 flex flex-col items-center justify-center h-full">
            <motion.div
              initial={{ scale: 0.6, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{
                delay: 0.5,
                type: "spring",
                stiffness: 260,
                damping: 20,
              }}
              className="relative"
            >
              {/* Effet de lueur */}
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute inset-0 bg-white/20 rounded-full blur-xl"
                style={{ width: "300px", height: "300px", margin: "0 auto" }}
              />

              {/* ✅ Logo sans fond - flottant */}
              <motion.div
                animate={{
                  y: [0, -15, 0],
                  rotate: [0, 3, -3, 0],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="relative"
              >
                <div className="w-64 h-64 mx-auto flex items-center justify-center">
                  <Logo size="xl" className="w-48 h-48" />
                </div>
              </motion.div>

              {/* Icônes décoratives animées */}
              <motion.div
                animate={{
                  y: [0, -15, 0],
                  x: [0, 10, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute -top-2 -right-2 bg-white/20 backdrop-blur-sm p-3 rounded-full border border-white/20"
              >
                <FiDroplet className="w-6 h-6 text-white" />
              </motion.div>

              <motion.div
                animate={{
                  y: [0, 15, 0],
                  x: [0, -10, 0],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1,
                }}
                className="absolute -bottom-2 -left-2 bg-white/20 backdrop-blur-sm p-3 rounded-full border border-white/20"
              >
                <FiAnchor className="w-6 h-6 text-white" />
              </motion.div>

              <motion.div
                animate={{
                  y: [0, -10, 0],
                  x: [0, -15, 0],
                }}
                transition={{
                  duration: 3.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5,
                }}
                className="absolute top-1/2 -left-6 bg-white/20 backdrop-blur-sm p-3 rounded-full border border-white/20"
              >
                <FiCompass className="w-5 h-5 text-white" />
              </motion.div>

              <motion.div
                animate={{
                  y: [0, -12, 0],
                  x: [0, 15, 0],
                }}
                transition={{
                  duration: 4.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1.5,
                }}
                className="absolute top-1/2 -right-6 bg-white/20 backdrop-blur-sm p-3 rounded-full border border-white/20"
              >
                <FiShield className="w-5 h-5 text-white" />
              </motion.div>
            </motion.div>

            {/* Texte de bienvenue */}
            <motion.div
              className="text-center mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <h2 className="text-3xl font-bold text-white mb-2">
                Bienvenue dans le club
              </h2>
              <p className="text-primary-100 text-sm">
                Gérez vos adhérents, sorties et plongées facilement
              </p>
            </motion.div>

            {/* Statistiques */}
            <motion.div
              className="grid grid-cols-3 gap-4 mt-6 text-white w-full max-w-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              {[
                { value: "150+", label: "Adhérents" },
                { value: "50+", label: "Sorties/an" },
                { value: "98%", label: "Satisfaction" },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-all duration-300 cursor-default"
                  whileHover={{ scale: 1.05, y: -5 }}
                >
                  <motion.p
                    className="text-2xl font-bold"
                    whileHover={{ scale: 1.1 }}
                  >
                    {stat.value}
                  </motion.p>
                  <p className="text-xs text-primary-100">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Effets de fond supplémentaires */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"
            />
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2,
              }}
              className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"
            />
            <motion.div
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.1, 0.3, 0.1],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
              }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl"
            />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
