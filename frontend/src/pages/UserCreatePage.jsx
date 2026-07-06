import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FiUserPlus,
  FiUser,
  FiMail,
  FiPhone,
  FiShield,
  FiAward,
  FiArrowLeft,
  FiSave,
  FiSend,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";
import { useUsers } from "../hooks/useUsers";
import { useAuth } from "../context/AuthContext";
import ProtectedRoute from "../components/Common/ProtectedRoute";

const UserCreatePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { useCreate } = useUsers();
  const create = useCreate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [emailSent, setEmailSent] = useState(false);
  const [createdUser, setCreatedUser] = useState(null);
  const [emailError, setEmailError] = useState(null);

  const isSubmitting = useRef(false);

  const [formData, setFormData] = useState({
    email: "",
    name: "",
    role: "adherent",
    phone: "",
    contact_urgence: "",
    niveau: "",
  });

  const roleOptions = [
    { value: "president", label: "👑 Président" },
    { value: "moniteur", label: "🏊 Moniteur" },
    { value: "tresorier", label: "💰 Trésorier" },
    { value: "adherent", label: "🤿 Adhérent" },
  ];

  const niveauOptions = [
    "Débutant",
    "Niveau 1",
    "Niveau 2",
    "Niveau 3",
    "Niveau 4",
    "Moniteur",
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (name === "email") {
      setEmailError(null);
      setEmailSent(false);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = "L'email est requis";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email invalide";
    }
    if (!formData.name) newErrors.name = "Le nom est requis";
    if (!formData.role) newErrors.role = "Le rôle est requis";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateTemporaryPassword = () => {
    const length = 12;
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=";
    let password = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    return password;
  };

  const sendWelcomeEmail = async (userData, temporaryPassword) => {
    try {
      const payload = {
        to: userData.email,
        user: {
          name: userData.name,
          email: userData.email,
          role: userData.role,
        },
        temporaryPassword: temporaryPassword,
        loginUrl: `${window.location.origin}/login`,
      };

      console.log(
        "📧 Envoi de l'email avec le mot de passe:",
        temporaryPassword,
      );

      const response = await fetch("/api/email/send-welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Erreur lors de l'envoi de l'email",
        );
      }

      return await response.json();
    } catch (error) {
      console.error("❌ Erreur envoi email:", error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting.current) {
      console.log("⛔ Soumission déjà en cours");
      return;
    }

    if (!validate()) return;

    isSubmitting.current = true;
    setLoading(true);
    setEmailSent(false);
    setEmailError(null);

    try {
      const temporaryPassword = generateTemporaryPassword();
      console.log("🔑 Mot de passe généré:", temporaryPassword);

      const emailResult = await sendWelcomeEmail(
        { name: formData.name, email: formData.email, role: formData.role },
        temporaryPassword,
      );

      if (emailResult.success) {
        console.log("✅ Email envoyé, création de l'utilisateur...");

        const userData = {
          ...formData,
          password: temporaryPassword,
          password_confirm: temporaryPassword,
          must_change_password: true,
          created_by: user?.id || "system",
          status: "active",
          email_sent: true,
          email_sent_at: new Date().toISOString(),
        };

        const result = await create.mutateAsync(userData);

        if (result?.data) {
          setCreatedUser(result.data);
          setEmailSent(true);
          toast.success("✅ Utilisateur créé avec succès ! Email envoyé.");

          setTimeout(() => navigate("/users"), 3000);
        }
      } else {
        throw new Error("L'email n'a pas pu être envoyé.");
      }
    } catch (error) {
      console.error("❌ Erreur:", error);
      const errorMessage = error.response?.data?.message || error.message;

      if (errorMessage.includes("email") || errorMessage.includes("mail")) {
        setEmailError(
          "❌ L'email n'a pas pu être envoyé. Aucun utilisateur n'a été créé.",
        );
        toast.error("❌ Échec de l'envoi de l'email.");
      } else {
        toast.error(errorMessage || "Erreur lors de la création");
      }
    } finally {
      setLoading(false);
      setTimeout(() => {
        isSubmitting.current = false;
      }, 3000);
    }
  };

  return (
    <ProtectedRoute requiredPermission="manage_users">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-3xl mx-auto space-y-6 p-4"
      >
        {/* En-tête */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <FiUserPlus className="w-6 h-6 text-cyan-500" />
              Nouvel utilisateur
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Créez un nouveau compte utilisateur
            </p>
          </div>
          <button
            onClick={() => navigate("/users")}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-300"
            disabled={loading}
          >
            <FiArrowLeft className="w-4 h-4" /> Retour
          </button>
        </div>

        {/* Succès */}
        {emailSent && createdUser && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-xl p-4"
          >
            <div className="flex items-start gap-3">
              <FiCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-300">
                  ✅ Email envoyé avec succès !
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  Un email avec les identifiants de connexion a été envoyé à{" "}
                  {formData.email}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  Redirection vers la liste des utilisateurs...
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Erreur */}
        {emailError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl p-4"
          >
            <div className="flex items-start gap-3">
              <FiAlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-300">
                  ❌ Échec de l'envoi de l'email
                </p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  {emailError}
                </p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-semibold">
                  ⚠️ Aucun utilisateur n'a été créé. Veuillez réessayer.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Formulaire */}
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100/80 dark:border-gray-700/80 p-6 space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nom complet *
              </label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Jean Dupont"
                  className={`w-full pl-10 pr-4 py-3 text-sm border-2 rounded-xl focus:outline-none transition-all duration-300 bg-white dark:bg-gray-900 text-gray-900 dark:text-white ${errors.name ? "border-red-400 focus:border-red-500 shadow-[0_0_0_4px_rgba(239,68,68,0.1)]" : "border-gray-200 dark:border-gray-600 focus:border-cyan-500 shadow-[0_0_0_4px_rgba(6,182,212,0.1)]"}`}
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email *
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="jean@email.com"
                  className={`w-full pl-10 pr-4 py-3 text-sm border-2 rounded-xl focus:outline-none transition-all duration-300 bg-white dark:bg-gray-900 text-gray-900 dark:text-white ${errors.email ? "border-red-400 focus:border-red-500 shadow-[0_0_0_4px_rgba(239,68,68,0.1)]" : "border-gray-200 dark:border-gray-600 focus:border-cyan-500 shadow-[0_0_0_4px_rgba(6,182,212,0.1)]"}`}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rôle *
              </label>
              <div className="relative">
                <FiShield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 text-sm border-2 rounded-xl focus:outline-none transition-all duration-300 bg-white dark:bg-gray-900 text-gray-900 dark:text-white appearance-none ${errors.role ? "border-red-400 focus:border-red-500 shadow-[0_0_0_4px_rgba(239,68,68,0.1)]" : "border-gray-200 dark:border-gray-600 focus:border-cyan-500 shadow-[0_0_0_4px_rgba(6,182,212,0.1)]"}`}
                >
                  {roleOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">{errors.role}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Téléphone
              </label>
              <div className="relative">
                <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="0612345678"
                  className="w-full pl-10 pr-4 py-3 text-sm border-2 rounded-xl focus:outline-none transition-all duration-300 bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-gray-200 dark:border-gray-600 focus:border-cyan-500 shadow-[0_0_0_4px_rgba(6,182,212,0.1)]"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contact d'urgence
              </label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  name="contact_urgence"
                  value={formData.contact_urgence}
                  onChange={handleChange}
                  placeholder="Marie Dupont - 0612345678"
                  className="w-full pl-10 pr-4 py-3 text-sm border-2 rounded-xl focus:outline-none transition-all duration-300 bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-gray-200 dark:border-gray-600 focus:border-cyan-500 shadow-[0_0_0_4px_rgba(6,182,212,0.1)]"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Niveau de plongée
              </label>
              <div className="relative">
                <FiAward className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  name="niveau"
                  value={formData.niveau}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 text-sm border-2 rounded-xl focus:outline-none transition-all duration-300 bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-gray-200 dark:border-gray-600 focus:border-cyan-500 shadow-[0_0_0_4px_rgba(6,182,212,0.1)] appearance-none"
                >
                  <option value="">Sélectionner un niveau</option>
                  {niveauOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div
            className={`rounded-xl p-4 border ${emailError ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/30" : "bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800/30"}`}
          >
            <div className="flex items-start gap-3">
              {emailError ? (
                <FiAlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              ) : (
                <FiSend className="w-5 h-5 text-cyan-500 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p
                  className={`text-sm ${emailError ? "text-red-700 dark:text-red-300" : "text-cyan-700 dark:text-cyan-300"}`}
                >
                  {emailError
                    ? "L'email n'a pas pu être envoyé. Aucun utilisateur n'a été créé."
                    : "Un email sera envoyé à l'utilisateur avec ses identifiants de connexion."}
                </p>
                {!emailError && (
                  <p className="text-xs text-cyan-600 dark:text-cyan-400 mt-1">
                    L'utilisateur devra changer son mot de passe à la première
                    connexion.
                  </p>
                )}
                {emailError && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-semibold">
                    ⚠️ Vérifiez l'adresse email et réessayez.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => navigate("/users")}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-300"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || create.isPending || isSubmitting.current}
              className="inline-flex items-center justify-center gap-2 px-7 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-700 hover:via-blue-700 hover:to-indigo-700 rounded-xl transition-all duration-300 shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/35 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading || create.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  {emailSent ? "Création..." : "Envoi de l'email..."}
                </>
              ) : (
                <>
                  <FiSave className="w-4 h-4" />
                  Créer l'utilisateur
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </ProtectedRoute>
  );
};

export default UserCreatePage;
