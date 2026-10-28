import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiCalendar,
  FiSave,
  FiX,
} from "react-icons/fi";
import { useTresoriers } from "../../hooks/Tresorier/useTresoriers";
import { useCloseFormModal } from "../../hooks/useFormModal";
import { useUsers } from "../../hooks/User/useUsers";
import LoadingSpinner from "../Common/LoadingSpinner";
import { sendWelcomeEmailIfNeeded } from "../../utils/welcomeEmail";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

const TresorierForm = () => {
  // Ferme la modale en revenant sur la page d'où elle a été ouverte (ex.
  // UserCreatePage) si elle vient de là, sinon sur la liste des trésoriers —
  // voir useCloseFormModal.
  const closeModal = useCloseFormModal("/tresoriers");
  const { id } = useParams();
  const editMode = !!id;

  const { useGetById, useCreate, useUpdate } = useTresoriers();
  const { useGetAll: useGetAllUsers, useUpdateInfo } = useUsers();

  const { data: tresorierData, isLoading: loadingData } = useGetById(id);
  const { data: usersData, isLoading: loadingUsers } = useGetAllUsers();

  const create = useCreate();
  const update = useUpdate();
  const updateInfo = useUpdateInfo();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [focused, setFocused] = useState(null);

  const [formData, setFormData] = useState({
    user_id: "",
    email: "",
    name: "",
    phone: "",
    annee_en_poste: new Date().getFullYear(),
  });

  useEffect(() => {
    if (editMode && id && tresorierData?.data) {
      const tresorier = tresorierData.data;
      const compte = usersData?.data?.find((u) => u.id === tresorier.user_id);
      setFormData((prev) => ({
        ...prev,
        user_id: tresorier.user_id || "",
        email: compte?.email || "",
        name: compte?.name || "",
        phone: compte?.phone || "",
        annee_en_poste: tresorier.annee_en_poste || "",
      }));
    }
  }, [editMode, id, tresorierData, usersData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFocus = (name) => setFocused(name);
  const handleBlur = () => setFocused(null);

  const validate = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = "L'email est requis";
    if (!formData.name) newErrors.name = "Le nom est requis";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        annee_en_poste: formData.annee_en_poste || undefined,
      };

      // Création : toujours un nouveau compte (le lien vers un compte
      // existant a été retiré du formulaire).
      if (!editMode) {
        payload.email = formData.email;
        payload.name = formData.name;
        payload.phone = formData.phone;
      }

      if (editMode && id) {
        await update.mutateAsync({ id, data: payload });
        // Informations du compte lié (email/nom/téléphone) — distinctes de
        // la fiche trésorier elle-même, voir UserController.updateUserInfo.
        if (formData.user_id) {
          await updateInfo.mutateAsync({
            id: formData.user_id,
            data: {
              name: formData.name,
              email: formData.email,
              phone: formData.phone,
            },
          });
        }
      } else {
        const result = await create.mutateAsync(payload);
        await sendWelcomeEmailIfNeeded(result);
      }
      closeModal();
    } catch (error) {
      console.error("Échec de l'enregistrement du trésorier :", error);
    } finally {
      setLoading(false);
    }
  };

  if (editMode && loadingData) return <LoadingSpinner variant="form" />;
  if (loadingUsers) return <LoadingSpinner variant="form" />;

  const inputClasses = (fieldName) =>
    `w-full pl-4 pr-4 py-2.5 text-sm border rounded-lg focus:outline-none transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
      errors[fieldName]
        ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200"
        : focused === fieldName
          ? "border-blue-500 focus:ring-2 focus:ring-blue-200"
          : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
    }`;

  const labelClasses =
    "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";

  return (
    <form onSubmit={handleSubmit}>
      {/* Corps du formulaire */}
      <div className="p-6 space-y-6">
        {/* Création : nouveau compte ; édition : correction de l'email/du
            nom/du téléphone du compte lié (voir AccountManagementCard.jsx
            pour le reste de la gestion de compte — statut/mot de passe/
            rôle/suppression). */}
        <motion.div
          {...fadeInUp}
          className="grid grid-cols-1 md:grid-cols-2 gap-5"
        >
          <div>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiMail className="w-4 h-4 text-gray-400" />
                Email *
              </span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onFocus={() => handleFocus("email")}
              onBlur={handleBlur}
              className={inputClasses("email")}
              placeholder="tresorier@club.fr"
            />
            {errors.email && (
              <p className="mt-1.5 text-sm text-red-500">{errors.email}</p>
            )}
          </div>
          <div>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiUser className="w-4 h-4 text-gray-400" />
                Nom complet *
              </span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              onFocus={() => handleFocus("name")}
              onBlur={handleBlur}
              className={inputClasses("name")}
              placeholder="Jean Dupont"
            />
            {errors.name && (
              <p className="mt-1.5 text-sm text-red-500">{errors.name}</p>
            )}
          </div>
          <div>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiPhone className="w-4 h-4 text-gray-400" />
                Téléphone
              </span>
            </label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              onFocus={() => handleFocus("phone")}
              onBlur={handleBlur}
              className={inputClasses("phone")}
              placeholder="06 12 34 56 78"
            />
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiCalendar className="w-4 h-4 text-gray-400" />
                Année en poste
              </span>
            </label>
            <input
              type="number"
              name="annee_en_poste"
              value={formData.annee_en_poste}
              onChange={handleChange}
              onFocus={() => handleFocus("annee_en_poste")}
              onBlur={handleBlur}
              className={inputClasses("annee_en_poste")}
              placeholder="2024"
            />
          </motion.div>
        </div>
      </div>

      {/* Pied de page */}
      <div className="sticky bottom-0 px-6 py-4 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-end gap-3">
        <button
          type="button"
          onClick={closeModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
        >
          <FiX className="w-4 h-4" />
          Annuler
        </button>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-6 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm hover:shadow disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
          ) : (
            <FiSave className="w-4 h-4" />
          )}
          {editMode ? "Mettre à jour" : "Créer le trésorier"}
        </button>
      </div>
    </form>
  );
};

export default TresorierForm;
