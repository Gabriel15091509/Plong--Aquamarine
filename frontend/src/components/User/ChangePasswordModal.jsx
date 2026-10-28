import React, { useState } from "react";
import { motion } from "framer-motion";
import { FiKey, FiSave, FiEye, FiEyeOff, FiShield, FiX } from "react-icons/fi";
import ModalOverlay from "../Common/ModalOverlay";
import PasswordStrengthMeter from "../Common/PasswordStrengthMeter";
import { useAuth } from "../../context/AuthContext";
import { useUsers } from "../../hooks/User/useUsers";
import { isPasswordStrong } from "../../utils/passwordStrength";
import {
  getPasswordInputType,
  getPasswordInputStyle,
} from "../../utils/passwordFieldType";

// Changement de mot de passe VOLONTAIRE (depuis ParametresPage.jsx) en
// modale, plutôt qu'une navigation vers /change-password (page toujours
// utilisée telle quelle pour le changement FORCÉ à la connexion —
// LoginPage.jsx y navigue avec `fromLogin: true` — un flux bloquant qui ne
// doit pas pouvoir se refermer comme une modale ; ce composant ne couvre
// donc que le cas volontaire, sans l'écran "Retour à la connexion" ni le
// titre/sous-titre alternatifs de la page). Mêmes protections anti-autofill
// (champs leurres, readOnly jusqu'au premier focus, type="text" masqué —
// voir ChangePasswordPage.jsx pour le détail de chaque astuce) : recopiées
// ici à l'identique, pas de hook partagé pour ne pas complexifier une page
// de connexion déjà sensible.
const ChangePasswordModal = ({ isOpen, onClose }) => {
  const { updateUser } = useAuth();
  const { useChangePassword } = useUsers();
  const changePassword = useChangePassword();
  const [showPasswords, setShowPasswords] = useState({
    new: false,
    confirm: false,
  });
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordFieldsEditable, setPasswordFieldsEditable] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const togglePassword = (field) =>
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));

  const handleFocusEditable = () => {
    setTimeout(() => setPasswordFieldsEditable(true), 0);
  };

  const resetAndClose = () => {
    setFormData({ newPassword: "", confirmPassword: "" });
    setErrors({});
    setPasswordFieldsEditable(false);
    onClose();
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.newPassword)
      newErrors.newPassword = "Le nouveau mot de passe est requis";
    else if (!isPasswordStrong(formData.newPassword))
      newErrors.newPassword =
        "Le mot de passe ne respecte pas encore tous les critères ci-dessous";
    if (!formData.confirmPassword)
      newErrors.confirmPassword = "La confirmation est requise";
    else if (formData.newPassword !== formData.confirmPassword)
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    changePassword.mutate(
      { oldPassword: "", newPassword: formData.newPassword },
      {
        onSuccess: (response) => {
          if (!response.success) return;
          const { token, user: userData } = response.data;
          updateUser({ ...userData, token });
          resetAndClose();
        },
      },
    );
  };

  return (
    <ModalOverlay
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={resetAndClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", damping: 25 }}
        className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={resetAndClose}
          className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
          aria-label="Fermer"
        >
          <FiX className="w-5 h-5" />
        </button>

        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: "spring" }}
            className="w-16 h-16 bg-gradient-to-r from-blue-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
          >
            <FiKey className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Modifier le mot de passe
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Mettez à jour votre mot de passe
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Champs leurres anti-autofill — voir ChangePasswordPage.jsx. */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              width: 0,
              height: 0,
              overflow: "hidden",
              opacity: 0,
              pointerEvents: "none",
            }}
          >
            <input type="text" name="email" autoComplete="username" tabIndex={-1} readOnly />
            <input type="password" name="password" autoComplete="current-password" tabIndex={-1} readOnly />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nouveau mot de passe *
            </label>
            <div className="relative">
              <FiKey className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={getPasswordInputType(showPasswords.new)}
                style={getPasswordInputStyle(showPasswords.new)}
                name="newPassword"
                autoComplete="new-password"
                readOnly={!passwordFieldsEditable}
                onFocus={handleFocusEditable}
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
              <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
            )}
            <PasswordStrengthMeter password={formData.newPassword} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirmer le mot de passe *
            </label>
            <div className="relative">
              <FiShield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={getPasswordInputType(showPasswords.confirm)}
                style={getPasswordInputStyle(showPasswords.confirm)}
                name="confirmPassword"
                autoComplete="new-password"
                readOnly={!passwordFieldsEditable}
                onFocus={handleFocusEditable}
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

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={resetAndClose}
              className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={changePassword.isPending}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-xl hover:shadow-lg transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {changePassword.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />{" "}
                  Changement...
                </>
              ) : (
                <>
                  <FiSave className="w-5 h-5" /> Valider
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </ModalOverlay>
  );
};

export default ChangePasswordModal;
