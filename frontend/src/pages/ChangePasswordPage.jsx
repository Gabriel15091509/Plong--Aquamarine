// frontend/src/pages/ChangePasswordPage.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FiKey,
  FiSave,
  FiArrowLeft,
  FiEye,
  FiEyeOff,
  FiShield,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import userService from "../services/userService";
import toast from "react-hot-toast";

const ChangePasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, updateUser } = useAuth();
  const [pageLoading, setPageLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    new: false,
    confirm: false,
  });
  const [errors, setErrors] = useState({});
  const [isFromLogin, setIsFromLogin] = useState(false);
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    // ✅ Attendre que AuthContext ait fini de charger
    if (loading) return;

    const fromLogin = location.state?.fromLogin || false;
    const forcedChange = user?.must_change_password || false;

    if (fromLogin || forcedChange) {
      setIsFromLogin(true);
    } else {
      // L'utilisateur n'a pas à changer son mot de passe et n'arrive pas du login
      // → il a navigué manuellement vers cette page, c'est OK (changement volontaire)
      setIsFromLogin(false);
    }
  }, [loading, location.state, user?.must_change_password]);
  // ✅ Ne jamais rediriger dans ce useEffect : on laisse l'utilisateur changer son mdp

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const togglePassword = (field) =>
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));

  const validate = () => {
    const newErrors = {};
    if (!formData.newPassword)
      newErrors.newPassword = "Le nouveau mot de passe est requis";
    else if (formData.newPassword.length < 6)
      newErrors.newPassword = "Minimum 6 caractères";
    if (!formData.confirmPassword)
      newErrors.confirmPassword = "La confirmation est requise";
    else if (formData.newPassword !== formData.confirmPassword)
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setPageLoading(true);

    try {
      // ✅ oldPassword vide string si changement forcé — le backend gère ce cas
      const response = await userService.changePassword(
        "",
        formData.newPassword,
      );

      if (response.success) {
        const { token, user: userData } = response.data;

        // ✅ updateUser met à jour token + user dans AuthContext et localStorage
        updateUser({ ...userData, token });

        toast.success("Mot de passe changé avec succès !");
        navigate("/dashboard");
      }
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Erreur lors du changement de mot de passe";
      toast.error(message);
    } finally {
      setPageLoading(false);
    }
  };

  // ✅ Attendre le chargement avant d'afficher quoi que ce soit
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-16 h-16 bg-gradient-to-r from-blue-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
            >
              <FiKey className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              {isFromLogin
                ? "Changement de mot de passe requis"
                : "Modifier le mot de passe"}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
              {isFromLogin
                ? "Définissez un nouveau mot de passe pour sécuriser votre compte"
                : "Mettez à jour votre mot de passe"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nouveau mot de passe */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nouveau mot de passe *
              </label>
              <div className="relative">
                <FiKey className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPasswords.new ? "text" : "password"}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-10 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.newPassword ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
                />
                <button
                  type="button"
                  onClick={() => togglePassword("new")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPasswords.new ? (
                    <FiEyeOff className="w-5 h-5" />
                  ) : (
                    <FiEye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.newPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.newPassword}
                </p>
              )}
            </div>

            {/* Confirmation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirmer le mot de passe *
              </label>
              <div className="relative">
                <FiShield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPasswords.confirm ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-10 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.confirmPassword ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`}
                />
                <button
                  type="button"
                  onClick={() => togglePassword("confirm")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPasswords.confirm ? (
                    <FiEyeOff className="w-5 h-5" />
                  ) : (
                    <FiEye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800/30">
              <p className="text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
                <span>🔒</span>
                <span>
                  Utilisez au moins 8 caractères avec majuscules, minuscules,
                  chiffres et caractères spéciaux.
                </span>
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              {!isFromLogin && (
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                >
                  Annuler
                </button>
              )}
              <button
                type="submit"
                disabled={pageLoading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-xl hover:shadow-lg transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {pageLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />{" "}
                    Changement...
                  </>
                ) : (
                  <>
                    <FiSave className="w-5 h-5" /> Changer le mot de passe
                  </>
                )}
              </button>
            </div>
          </form>

          {isFromLogin && (
            <div className="mt-6 text-center">
              <button
                onClick={() => navigate("/login")}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 transition-colors flex items-center justify-center gap-2 mx-auto"
              >
                <FiArrowLeft className="w-4 h-4" /> Retour à la connexion
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ChangePasswordPage;
