// frontend/src/pages/Auth/ChangePasswordPage.jsx
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
import { useAuth } from "../../context/AuthContext";
import { useUsers } from "../../hooks/User/useUsers";
import PasswordStrengthMeter from "../../components/Common/PasswordStrengthMeter";
import { isPasswordStrong } from "../../utils/passwordStrength";
import { getPasswordInputType, getPasswordInputStyle } from "../../utils/passwordFieldType";

const ChangePasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, updateUser } = useAuth();
  const { useChangePassword } = useUsers();
  const changePassword = useChangePassword();
  const pageLoading = changePassword.isPending;
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
  // Les deux champs restent `readOnly` jusqu'au premier focus (voir
  // handleFocusEditable) — empêche Chrome de proposer ses identifiants déjà
  // enregistrés sur un champ de CRÉATION de mot de passe (autoComplete=
  // "new-password" seul ne suffit pas toujours, Chrome l'ignore parfois).
  // Piloté par un state (et non `input.removeAttribute` en direct) : sinon
  // le prochain re-rendu React (déclenché par la première frappe elle-même)
  // réappliquerait l'attribut JSX figé et re-verrouillerait le champ après
  // un seul caractère.
  const [passwordFieldsEditable, setPasswordFieldsEditable] = useState(false);

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

  // setTimeout(0) plutôt qu'un retrait synchrone du readOnly dans le même
  // événement focus : Chrome évalue parfois s'il doit proposer ses
  // identifiants enregistrés au moment même du focus, avant que la mise à
  // jour React (donc le retrait réel de readOnly côté DOM) n'ait eu lieu —
  // décaler d'un tick laisse cette évaluation se faire sur un champ encore
  // readOnly (donc ignoré par cette suggestion), puis rend le champ
  // modifiable juste après, bien avant que l'utilisateur n'ait matériellement
  // eu le temps de taper un caractère.
  const handleFocusEditable = () => {
    setTimeout(() => setPasswordFieldsEditable(true), 0);
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

    // ✅ oldPassword vide string si changement forcé — le backend gère ce cas
    changePassword.mutate(
      { oldPassword: "", newPassword: formData.newPassword },
      {
        onSuccess: (response) => {
          if (!response.success) return;
          const { user: userData } = response.data;
          updateUser(userData);
          navigate("/dashboard");
        },
      },
    );
  };

  // ✅ Attendre le chargement avant d'afficher quoi que ce soit
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  // Pas de `min-h-screen` ici (contrairement à LoginPage.jsx/
  // ResetPasswordPage.jsx) : cette page est toujours rendue à l'intérieur de
  // <Layout> (voir App.jsx, forcé ou non), qui affiche déjà sidebar/header
  // et fournit son propre fond de page — un `min-h-screen` posé ICI en plus
  // s'additionnait à la hauteur déjà prise par ce chrome, forçant la page à
  // dépasser la hauteur de l'écran (scroll inutile). `flex-1` s'appuie sur
  // le contexte flex posé sur le wrapper de <Layout> (voir Layout.jsx) pour
  // occuper toute la hauteur réellement disponible de la zone de contenu —
  // centre donc la carte à équidistance du haut et du bas de cette zone,
  // sans jamais dépasser (et donc jamais réintroduire le débordement corrigé
  // ci-dessus).
  return (
    <div className="flex-1 flex items-center justify-center">
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
            {/* Champs leurres, jamais visibles ni atteignables au clavier —
                Chrome (et d'autres navigateurs) proposent parfois quand même
                leurs identifiants enregistrés sur le premier couple
                email/mot de passe qu'ils repèrent dans un formulaire, quoi
                que dise `autoComplete` sur CE champ précis (voir le correctif
                readOnly ci-dessous, qui ne suffit pas toujours seul). Leur
                présence avant les vrais champs absorbe cette suggestion —
                jamais `display:none`/`hidden`, ignorés par cette détection :
                juste rendus invisibles et hors du flux normal.
                `tabIndex={-1}` + `aria-hidden` : jamais atteints au clavier
                (Tab) ni par un lecteur d'écran. */}
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

            {/* Nouveau mot de passe */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nouveau mot de passe *
              </label>
              <div className="relative">
                <FiKey className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  // type="text" + masquage CSS (voir passwordFieldType.js) au
                  // lieu du vrai type="password" quand le navigateur le
                  // permet : le menu de suggestions de Chrome se déclenche
                  // précisément sur type="password", jamais sur un champ
                  // texte — même masqué visuellement à l'identique. Les
                  // correctifs précédents (autoComplete="new-password",
                  // readOnly différé, champs leurres) restent en place en
                  // complément, mais ne suffisaient pas seuls.
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
                <p className="mt-1 text-sm text-red-600">
                  {errors.newPassword}
                </p>
              )}
              <PasswordStrengthMeter password={formData.newPassword} />
            </div>

            {/* Confirmation */}
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
