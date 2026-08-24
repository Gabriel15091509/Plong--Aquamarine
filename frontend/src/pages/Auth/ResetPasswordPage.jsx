import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FiLock, FiEye, FiEyeOff, FiShield, FiArrowLeft, FiAlertCircle } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import Logo from "../../components/Common/Logo";

// Étape 2 du flux "Mot de passe oublié ?" : ouverte depuis le lien reçu par
// email (?token=...), demande le nouveau mot de passe puis connecte
// directement (voir AuthContext.resetPassword → completeSession), même
// habillage que ForgotPasswordPage.jsx/LoginPage.jsx.
const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { resetPassword } = useAuth();

  const [showPasswords, setShowPasswords] = useState({ new: false, confirm: false });
  const [formData, setFormData] = useState({ newPassword: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const togglePassword = (field) =>
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.newPassword) newErrors.newPassword = "Le mot de passe est requis";
    else if (formData.newPassword.length < 6)
      newErrors.newPassword = "Minimum 6 caractères";
    if (formData.newPassword !== formData.confirmPassword)
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await resetPassword(token, formData.newPassword);
      navigate("/dashboard");
    } catch {
      // toast.error déjà géré dans AuthContext.resetPassword()
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

        {!token ? (
          <div className="text-center py-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 mb-5">
              <FiAlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
              Lien invalide
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              Ce lien de réinitialisation est incomplet. Redemandez-en un
              nouveau depuis la page de connexion.
            </p>
            <Link
              to="/forgot-password"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-ocean-500 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-shadow"
            >
              Demander un nouveau lien
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
                Nouveau mot de passe
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                Choisissez le mot de passe que vous utiliserez désormais pour
                vous connecter.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    autoFocus
                    className={`w-full pl-10 pr-12 py-3 border ${
                      errors.newPassword
                        ? "border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    } rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300 bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400`}
                  />
                  <button
                    type="button"
                    onClick={() => togglePassword("new")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                  >
                    {showPasswords.new ? (
                      <FiEyeOff className="w-5 h-5" />
                    ) : (
                      <FiEye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.newPassword}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <FiShield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-12 py-3 border ${
                      errors.confirmPassword
                        ? "border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    } rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300 bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400`}
                  />
                  <button
                    type="button"
                    onClick={() => togglePassword("confirm")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                  >
                    {showPasswords.confirm ? (
                      <FiEyeOff className="w-5 h-5" />
                    ) : (
                      <FiEye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.confirmPassword}
                  </p>
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
                    Réinitialisation...
                  </>
                ) : (
                  "Réinitialiser le mot de passe"
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

export default ResetPasswordPage;
