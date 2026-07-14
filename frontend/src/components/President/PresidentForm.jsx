import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiUser,
  FiUserPlus,
  FiMail,
  FiPhone,
  FiCalendar,
  FiShield,
  FiSave,
  FiX,
  FiHash,
  FiKey,
} from "react-icons/fi";
import { usePresidents } from "../../hooks/usePresidents";
import { useMoniteurs } from "../../hooks/useMoniteurs";
import { useUsers } from "../../hooks/useUsers";
import LoadingSpinner from "../Common/LoadingSpinner";
import SearchableSelect from "../Common/SearchableSelect";
import { formatDateForInput } from "../../utils/helpers";
import { sendWelcomeEmailIfNeeded } from "../../utils/welcomeEmail";

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

const PresidentForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const editMode = !!id;

  const { useGetById, useCreate, useUpdate } = usePresidents();
  const { useGetAll: useGetAllMoniteurs } = useMoniteurs();
  const { useGetAll: useGetAllUsers } = useUsers();
  const { useGetAll: useGetAllPresidents } = usePresidents();

  const { data: presidentData, isLoading: loadingData } = useGetById(id);
  const { data: moniteursData, isLoading: loadingMoniteurs } =
    useGetAllMoniteurs();
  const { data: usersData, isLoading: loadingUsers } = useGetAllUsers();
  const { data: presidentsData } = useGetAllPresidents();

  const create = useCreate();
  const update = useUpdate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [focused, setFocused] = useState(null);
  const [sourceMode, setSourceMode] = useState("existing"); // "existing" | "new"

  const [formData, setFormData] = useState({
    id_moniteur: "",
    email: "",
    name: "",
    phone: "",
    num_brevet: "",
    date_obtention_brevet: "",
    annee_en_poste: new Date().getFullYear(),
    acces: "",
  });

  const userMap = useMemo(() => {
    const map = {};
    if (usersData?.data) {
      usersData.data.forEach((u) => {
        map[u.id] = u;
      });
    }
    return map;
  }, [usersData]);

  // Moniteurs pas encore promus président
  const availableMoniteurs = useMemo(() => {
    const moniteurs = moniteursData?.data || [];
    const existingMoniteurIds = new Set(
      (presidentsData?.data || []).map((p) => p.id_moniteur),
    );
    return moniteurs.filter((m) => !existingMoniteurIds.has(m.id_moniteur));
  }, [moniteursData, presidentsData]);

  useEffect(() => {
    if (editMode && id && presidentData?.data) {
      const president = presidentData.data;
      setFormData((prev) => ({
        ...prev,
        id_moniteur: president.id_moniteur || "",
        annee_en_poste: president.annee_en_poste || new Date().getFullYear(),
        acces: arrayToText(president.acces),
      }));
    }
  }, [editMode, id, presidentData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFocus = (name) => setFocused(name);
  const handleBlur = () => setFocused(null);

  const validate = () => {
    const newErrors = {};
    if (!editMode) {
      if (sourceMode === "existing" && !formData.id_moniteur) {
        newErrors.id_moniteur = "Sélectionnez un moniteur à promouvoir";
      }
      if (sourceMode === "new") {
        if (!formData.email) newErrors.email = "L'email est requis";
        if (!formData.name) newErrors.name = "Le nom est requis";
        if (!formData.num_brevet)
          newErrors.num_brevet = "Le numéro de brevet est requis";
        if (!formData.date_obtention_brevet)
          newErrors.date_obtention_brevet = "La date d'obtention est requise";
      }
    }
    if (!formData.annee_en_poste)
      newErrors.annee_en_poste = "L'année en poste est requise";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        annee_en_poste: formData.annee_en_poste,
        acces: textToArray(formData.acces),
      };

      if (!editMode) {
        if (sourceMode === "existing") {
          payload.id_moniteur = formData.id_moniteur;
        } else {
          payload.email = formData.email;
          payload.name = formData.name;
          payload.phone = formData.phone;
          payload.num_brevet = formData.num_brevet;
          payload.date_obtention_brevet = formData.date_obtention_brevet;
        }
      }

      if (editMode && id) {
        await update.mutateAsync({ id, data: payload });
      } else {
        const result = await create.mutateAsync(payload);
        await sendWelcomeEmailIfNeeded(result);
      }
      navigate("/presidents");
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (editMode && loadingData) return <LoadingSpinner />;
  if (loadingMoniteurs || loadingUsers) return <LoadingSpinner />;

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
              {editMode ? "Modifier le président" : "Nouveau président"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {editMode
                ? "Mettez à jour la fiche du président"
                : "Désignez un nouveau président du club"}
            </p>
          </div>
          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
            <FiShield className="w-6 h-6 text-amber-600 dark:text-amber-400" />
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
                onClick={() => setSourceMode("existing")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
                  sourceMode === "existing"
                    ? "bg-amber-600 text-white border-amber-600"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-gray-400"
                }`}
              >
                <FiUser className="w-4 h-4" />
                Promouvoir un moniteur existant
              </button>
              <button
                type="button"
                onClick={() => setSourceMode("new")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
                  sourceMode === "new"
                    ? "bg-amber-600 text-white border-amber-600"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-gray-400"
                }`}
              >
                <FiUserPlus className="w-4 h-4" />
                Créer un nouveau compte
              </button>
            </div>

            {sourceMode === "existing" ? (
              <SearchableSelect
                label="Moniteur à promouvoir *"
                value={formData.id_moniteur}
                onChange={(value) => {
                  setFormData((prev) => ({ ...prev, id_moniteur: value }));
                  if (errors.id_moniteur)
                    setErrors((prev) => ({ ...prev, id_moniteur: "" }));
                }}
                options={availableMoniteurs}
                getOptionLabel={(m) =>
                  `${userMap[m.user_id]?.name || `Moniteur #${m.id_moniteur}`} - ${m.num_brevet}`
                }
                getOptionValue={(m) => m.id_moniteur}
                placeholder="Rechercher un moniteur..."
                error={errors.id_moniteur}
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
                    placeholder="president@club.fr"
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
                <div>
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
                </div>
                <div>
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
                </div>
              </div>
            )}
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiCalendar className="w-4 h-4 text-gray-400" />
                Année en poste *
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
            {errors.annee_en_poste && (
              <p className="mt-1.5 text-sm text-red-500">
                {errors.annee_en_poste}
              </p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiKey className="w-4 h-4 text-gray-400" />
                Accès / droits
              </span>
            </label>
            <input
              type="text"
              name="acces"
              value={formData.acces}
              onChange={handleChange}
              onFocus={() => handleFocus("acces")}
              onBlur={handleBlur}
              className={inputClasses("acces")}
              placeholder="Gestion financière, Validation adhésions"
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
          onClick={() => navigate("/presidents")}
          className="inline-flex items-center justify-center gap-2 px-5 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
        >
          <FiX className="w-4 h-4" />
          Annuler
        </button>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-6 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors shadow-sm hover:shadow disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
          ) : (
            <FiSave className="w-4 h-4" />
          )}
          {editMode ? "Mettre à jour" : "Créer le président"}
        </button>
      </div>
    </motion.form>
  );
};

export default PresidentForm;
