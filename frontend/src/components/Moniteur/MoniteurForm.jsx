import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiUser,
  FiUserPlus,
  FiMail,
  FiPhone,
  FiCalendar,
  FiAward,
  FiSave,
  FiX,
  FiTag,
  FiClock,
  FiHash,
} from "react-icons/fi";
import { useMoniteurs } from "../../hooks/Moniteur/useMoniteurs";
import { useUsers } from "../../hooks/User/useUsers";
import LoadingSpinner from "../Common/LoadingSpinner";
import SearchableSelect from "../Common/SearchableSelect";
import { formatDateForInput } from "../../utils/helpers";
import { sendWelcomeEmailIfNeeded } from "../../utils/welcomeEmail";
import {
  NIVEAU_MONITEUR_OPTIONS,
  SPECIALITE_ENCADREMENT_OPTIONS,
} from "../../utils/constants";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

const arrayToText = (value) => {
  if (!value) return "";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
};

const textToArray = (value) =>
  value
    .split(",")
    .map((v) => v.trim())
    .filter((v) => v.length > 0);

const MoniteurForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const editMode = !!id;

  const { useGetById, useCreate, useUpdate } = useMoniteurs();
  const { useGetAll: useGetAllUsers } = useUsers();
  const { useGetAll: useGetAllMoniteurs } = useMoniteurs();

  const { data: moniteurData, isLoading: loadingData } = useGetById(id);
  const { data: usersData, isLoading: loadingUsers } = useGetAllUsers();
  const { data: moniteursData } = useGetAllMoniteurs();

  const create = useCreate();
  const update = useUpdate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [focused, setFocused] = useState(null);
  const [accountMode, setAccountMode] = useState("existing"); // "existing" | "new"

  const [formData, setFormData] = useState({
    user_id: "",
    email: "",
    name: "",
    phone: "",
    niveau: "",
    num_brevet: "",
    date_obtention_brevet: "",
    specialites: [],
    disponibilites: "",
  });

  // Utilisateurs de rôle moniteur sans fiche moniteur déjà associée
  const availableUsers = useMemo(() => {
    const users = usersData?.data || [];
    const existingUserIds = new Set(
      (moniteursData?.data || []).map((m) => m.user_id),
    );
    return users.filter(
      (u) => u.role === "moniteur" && !existingUserIds.has(u.id),
    );
  }, [usersData, moniteursData]);

  useEffect(() => {
    if (editMode && id && moniteurData?.data) {
      const moniteur = moniteurData.data;
      setFormData((prev) => ({
        ...prev,
        user_id: moniteur.user_id || "",
        niveau: moniteur.niveau || "",
        num_brevet: moniteur.num_brevet || "",
        date_obtention_brevet: moniteur.date_obtention_brevet
          ? formatDateForInput(moniteur.date_obtention_brevet)
          : "",
        specialites: Array.isArray(moniteur.specialites) ? moniteur.specialites : [],
        disponibilites: arrayToText(moniteur.disponibilites),
      }));
    }
  }, [editMode, id, moniteurData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFocus = (name) => setFocused(name);
  const handleBlur = () => setFocused(null);

  const toggleSpecialite = (value) => {
    setFormData((prev) => {
      const has = prev.specialites.includes(value);
      return {
        ...prev,
        specialites: has
          ? prev.specialites.filter((s) => s !== value)
          : [...prev.specialites, value],
      };
    });
  };

  const validate = () => {
    const newErrors = {};
    if (!editMode) {
      if (accountMode === "existing" && !formData.user_id) {
        newErrors.user_id = "Sélectionnez un compte utilisateur";
      }
      if (accountMode === "new") {
        if (!formData.email) newErrors.email = "L'email est requis";
        if (!formData.name) newErrors.name = "Le nom est requis";
      }
    }
    if (!formData.niveau) {
      newErrors.niveau = "Le niveau est requis";
    } else if (!NIVEAU_MONITEUR_OPTIONS.includes(formData.niveau)) {
      newErrors.niveau = "Niveau 4 minimum requis pour encadrer";
    }
    if (!formData.num_brevet)
      newErrors.num_brevet = "Le numéro de brevet est requis";
    if (!formData.date_obtention_brevet)
      newErrors.date_obtention_brevet = "La date d'obtention est requise";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        niveau: formData.niveau,
        num_brevet: formData.num_brevet,
        date_obtention_brevet: formData.date_obtention_brevet,
        specialites: formData.specialites,
        disponibilites: textToArray(formData.disponibilites),
      };

      if (!editMode) {
        if (accountMode === "existing") {
          payload.user_id = formData.user_id;
        } else {
          payload.email = formData.email;
          payload.name = formData.name;
          payload.phone = formData.phone;
        }
      }

      if (editMode && id) {
        await update.mutateAsync({ id, data: payload });
      } else {
        const result = await create.mutateAsync(payload);
        await sendWelcomeEmailIfNeeded(result);
      }
      navigate("/moniteurs");
    } catch (error) {
      console.error("Échec de l'enregistrement du moniteur :", error);
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
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      onSubmit={handleSubmit}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      {/* En-tête */}
      <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {editMode ? "Modifier le moniteur" : "Nouveau moniteur"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {editMode
                ? "Mettez à jour la fiche du moniteur"
                : "Ajoutez un nouveau moniteur au club"}
            </p>
          </div>
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
            <FiAward className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </div>

      {/* Corps du formulaire */}
      <div className="p-6 space-y-6">
        {!editMode && (
          <motion.div {...fadeInUp} className="space-y-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAccountMode("existing")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
                  accountMode === "existing"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-gray-400"
                }`}
              >
                <FiUser className="w-4 h-4" />
                Lier un compte existant
              </button>
              <button
                type="button"
                onClick={() => setAccountMode("new")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
                  accountMode === "new"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-gray-400"
                }`}
              >
                <FiUserPlus className="w-4 h-4" />
                Créer un nouveau compte
              </button>
            </div>

            {accountMode === "existing" ? (
              <SearchableSelect
                label="Compte utilisateur (rôle moniteur) *"
                value={formData.user_id}
                onChange={(value) => {
                  setFormData((prev) => ({ ...prev, user_id: value }));
                  if (errors.user_id)
                    setErrors((prev) => ({ ...prev, user_id: "" }));
                }}
                options={availableUsers}
                getOptionLabel={(u) => `${u.name} - ${u.email}`}
                getOptionValue={(u) => u.id}
                placeholder="Rechercher un utilisateur..."
                error={errors.user_id}
                required={true}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                    placeholder="moniteur@club.fr"
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
              </div>
            )}
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiAward className="w-4 h-4 text-gray-400" />
                Niveau *
              </span>
            </label>
            <select
              name="niveau"
              value={formData.niveau}
              onChange={handleChange}
              onFocus={() => handleFocus("niveau")}
              onBlur={handleBlur}
              className={inputClasses("niveau")}
            >
              <option value="">Sélectionner...</option>
              {NIVEAU_MONITEUR_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            {errors.niveau && (
              <p className="mt-1.5 text-sm text-red-500">{errors.niveau}</p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiHash className="w-4 h-4 text-gray-400" />
                N° Brevet *
              </span>
            </label>
            <input
              type="text"
              name="num_brevet"
              value={formData.num_brevet}
              onChange={handleChange}
              onFocus={() => handleFocus("num_brevet")}
              onBlur={handleBlur}
              className={inputClasses("num_brevet")}
              placeholder="MF1-2024-001"
            />
            {errors.num_brevet && (
              <p className="mt-1.5 text-sm text-red-500">
                {errors.num_brevet}
              </p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiCalendar className="w-4 h-4 text-gray-400" />
                Date d'obtention du brevet *
              </span>
            </label>
            <input
              type="date"
              name="date_obtention_brevet"
              value={formData.date_obtention_brevet}
              onChange={handleChange}
              onFocus={() => handleFocus("date_obtention_brevet")}
              onBlur={handleBlur}
              className={inputClasses("date_obtention_brevet")}
            />
            {errors.date_obtention_brevet && (
              <p className="mt-1.5 text-sm text-red-500">
                {errors.date_obtention_brevet}
              </p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiTag className="w-4 h-4 text-gray-400" />
                Spécialités d&apos;encadrement
              </span>
            </label>
            <div className="flex flex-wrap gap-3 pt-1">
              {SPECIALITE_ENCADREMENT_OPTIONS.map((opt) => (
                <label
                  key={opt}
                  className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.specialites.includes(opt)}
                    onChange={() => toggleSpecialite(opt)}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  {opt}
                </label>
              ))}
            </div>
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiClock className="w-4 h-4 text-gray-400" />
                Disponibilités
              </span>
            </label>
            <input
              type="text"
              name="disponibilites"
              value={formData.disponibilites}
              onChange={handleChange}
              onFocus={() => handleFocus("disponibilites")}
              onBlur={handleBlur}
              className={inputClasses("disponibilites")}
              placeholder="Samedi matin, Dimanche"
            />
            <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
              Séparez les valeurs par des virgules
            </p>
          </motion.div>
        </div>
      </div>

      {/* Pied de page */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-end gap-3">
        <button
          type="button"
          onClick={() => navigate("/moniteurs")}
          className="inline-flex items-center justify-center gap-2 px-5 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
        >
          <FiX className="w-4 h-4" />
          Annuler
        </button>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm hover:shadow disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
          ) : (
            <FiSave className="w-4 h-4" />
          )}
          {editMode ? "Mettre à jour" : "Créer le moniteur"}
        </button>
      </div>
    </motion.form>
  );
};

export default MoniteurForm;
