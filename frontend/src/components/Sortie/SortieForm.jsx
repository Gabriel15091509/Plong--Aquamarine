import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  FiCalendar,
  FiMapPin,
  FiMap,
  FiTag,
  FiAward,
  FiUsers,
  FiDroplet,
  FiClock,
  FiDollarSign,
  FiSave,
  FiX,
  FiChevronRight,
  FiFileText,
  FiClipboard,
  FiInfo,
} from "react-icons/fi";
import { useSorties } from "../../hooks/useSorties";
import LoadingSpinner from "../Common/LoadingSpinner";
import {
  TYPE_SORTIE_OPTIONS,
  STATUT_SORTIE_OPTIONS,
  NIVEAU_OPTIONS,
} from "../../utils/constants";
import {
  formatDateForInput,
  formatDateTimeForInput,
} from "../../utils/helpers";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

const floatIcon = {
  initial: { y: 0 },
  animate: {
    y: [0, -5, 0],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
  },
};

const SortieForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const editMode = !!id;

  const { useGetById, useCreate, useUpdate } = useSorties();
  const { data, isLoading: loadingData } = useGetById(id);
  const create = useCreate();
  const update = useUpdate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [focused, setFocused] = useState(null);

  const [formData, setFormData] = useState({
    date_heure: "",
    lieu: "",
    site: "",
    type: "Plongée",
    niveau_requis: "Débutant",
    nb_places: 10,
    profondeur_max: 20,
    duree_estimee: "01:00",
    tarif: 0,
    statut: "Planifiée",
    description_site: "",
    date_ouverture_inscriptions: "",
    condition_affectation: "",
  });

  useEffect(() => {
    if (editMode && id && data?.data) {
      const s = data.data;
      setFormData({
        date_heure: formatDateTimeForInput(s.date_heure),
        lieu: s.lieu || "",
        site: s.site || "",
        type: s.type || "Plongée",
        niveau_requis: s.niveau_requis || "Débutant",
        nb_places: s.nb_places || 10,
        profondeur_max: s.profondeur_max || 20,
        duree_estimee: s.duree_estimee || "01:00",
        tarif: s.tarif || 0,
        statut: s.statut || "Planifiée",
        description_site: s.description_site || "",
        date_ouverture_inscriptions: formatDateForInput(
          s.date_ouverture_inscriptions,
        ),
        condition_affectation: s.condition_affectation || "",
      });
    }
  }, [editMode, id, data]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFocus = (name) => setFocused(name);
  const handleBlur = () => setFocused(null);

  const validate = () => {
    const newErrors = {};
    if (!formData.date_heure) newErrors.date_heure = "La date est requise";
    if (!formData.lieu) newErrors.lieu = "Le lieu est requis";
    if (!formData.site) newErrors.site = "Le site est requis";
    if (!formData.type) newErrors.type = "Le type est requis";
    if (!formData.nb_places || formData.nb_places < 1)
      newErrors.nb_places = "Minimum 1 place";
    if (!formData.profondeur_max || formData.profondeur_max < 0)
      newErrors.profondeur_max = "La profondeur est requise";
    if (!formData.tarif || formData.tarif < 0)
      newErrors.tarif = "Le tarif est requis";
    if (!formData.date_ouverture_inscriptions)
      newErrors.date_ouverture_inscriptions = "La date d'ouverture est requise";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (editMode && id) {
        await update.mutateAsync({ id, data: formData });
        toast.success("Sortie modifiée avec succès");
      } else {
        await create.mutateAsync(formData);
        toast.success("Sortie créée avec succès");
      }
      navigate("/sorties");
    } catch (error) {
      console.error("Error:", error);
      toast.error(
        error.response?.data?.message || "Erreur lors de l'enregistrement",
      );
    } finally {
      setLoading(false);
    }
  };

  if (editMode && loadingData) return <LoadingSpinner />;

  const inputClasses = (fieldName) =>
    `w-full pl-11 pr-4 py-3 text-sm border-2 rounded-xl focus:outline-none transition-all duration-300 bg-white dark:bg-gray-900 text-gray-900 dark:text-white ${
      errors[fieldName]
        ? "border-red-400 focus:border-red-500 shadow-[0_0_0_4px_rgba(239,68,68,0.1)]"
        : focused === fieldName
          ? "border-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,0.15)]"
          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
    }`;

  const labelClasses =
    "block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 tracking-tight";

  return (
    <motion.form
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.5,
        type: "spring",
        stiffness: 300,
        damping: 25,
      }}
      onSubmit={handleSubmit}
      className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100/80 dark:border-gray-800/80 overflow-hidden backdrop-blur-sm"
    >
      <div className="relative bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-600 dark:from-cyan-800 dark:via-blue-800 dark:to-indigo-800 px-8 py-7 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-white/5 rounded-full blur-2xl" />

        <div className="relative flex items-center justify-between">
          <div>
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-2xl font-bold text-white tracking-tight"
            >
              {editMode ? "Modifier la sortie" : "Nouvelle sortie"}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-sm text-cyan-100/80 mt-0.5 font-light"
            >
              {editMode
                ? "Mettez à jour les informations de la sortie"
                : "Planifiez une nouvelle sortie de plongée"}
            </motion.p>
          </div>
          <motion.div
            variants={floatIcon}
            initial="initial"
            animate="animate"
            className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 shadow-xl"
          >
            <FiMapPin className="w-7 h-7 text-white" />
          </motion.div>
        </div>
      </div>

      <div className="p-7 space-y-7">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiCalendar className="w-3.5 h-3.5 text-blue-500" />
                Date et heure *
              </span>
            </label>
            <div className="relative">
              <input
                type="datetime-local"
                name="date_heure"
                value={formData.date_heure}
                onChange={handleChange}
                onFocus={() => handleFocus("date_heure")}
                onBlur={handleBlur}
                className={inputClasses("date_heure")}
              />
            </div>
            {errors.date_heure && (
              <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                <span className="w-1 h-1 bg-red-500 rounded-full" />
                {errors.date_heure}
              </p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiMapPin className="w-3.5 h-3.5 text-blue-500" />
                Lieu *
              </span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="lieu"
                value={formData.lieu}
                onChange={handleChange}
                onFocus={() => handleFocus("lieu")}
                onBlur={handleBlur}
                className={inputClasses("lieu")}
                placeholder="Port de Plaisance"
              />
            </div>
            {errors.lieu && (
              <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                <span className="w-1 h-1 bg-red-500 rounded-full" />
                {errors.lieu}
              </p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiMap className="w-3.5 h-3.5 text-blue-500" />
                Site *
              </span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="site"
                value={formData.site}
                onChange={handleChange}
                onFocus={() => handleFocus("site")}
                onBlur={handleBlur}
                className={inputClasses("site")}
                placeholder="Île de Porquerolles"
              />
            </div>
            {errors.site && (
              <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                <span className="w-1 h-1 bg-red-500 rounded-full" />
                {errors.site}
              </p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiTag className="w-3.5 h-3.5 text-blue-500" />
                Type *
              </span>
            </label>
            <div className="relative">
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                onFocus={() => handleFocus("type")}
                onBlur={handleBlur}
                className={inputClasses("type")}
              >
                {TYPE_SORTIE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            {errors.type && (
              <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                <span className="w-1 h-1 bg-red-500 rounded-full" />
                {errors.type}
              </p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiAward className="w-3.5 h-3.5 text-blue-500" />
                Niveau requis
              </span>
            </label>
            <div className="relative">
              <select
                name="niveau_requis"
                value={formData.niveau_requis}
                onChange={handleChange}
                onFocus={() => handleFocus("niveau_requis")}
                onBlur={handleBlur}
                className={inputClasses("niveau_requis")}
              >
                {NIVEAU_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiUsers className="w-3.5 h-3.5 text-blue-500" />
                Nombre de places *
              </span>
            </label>
            <div className="relative">
              <input
                type="number"
                name="nb_places"
                value={formData.nb_places}
                onChange={handleChange}
                onFocus={() => handleFocus("nb_places")}
                onBlur={handleBlur}
                className={inputClasses("nb_places")}
                min="1"
              />
            </div>
            {errors.nb_places && (
              <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                <span className="w-1 h-1 bg-red-500 rounded-full" />
                {errors.nb_places}
              </p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiDroplet className="w-3.5 h-3.5 text-blue-500" />
                Profondeur max (m) *
              </span>
            </label>
            <div className="relative">
              <input
                type="number"
                name="profondeur_max"
                value={formData.profondeur_max}
                onChange={handleChange}
                onFocus={() => handleFocus("profondeur_max")}
                onBlur={handleBlur}
                className={inputClasses("profondeur_max")}
                min="0"
              />
            </div>
            {errors.profondeur_max && (
              <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                <span className="w-1 h-1 bg-red-500 rounded-full" />
                {errors.profondeur_max}
              </p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiClock className="w-3.5 h-3.5 text-blue-500" />
                Durée estimée (HH:MM)
              </span>
            </label>
            <div className="relative">
              <input
                type="time"
                name="duree_estimee"
                value={formData.duree_estimee}
                onChange={handleChange}
                onFocus={() => handleFocus("duree_estimee")}
                onBlur={handleBlur}
                className={inputClasses("duree_estimee")}
              />
            </div>
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiDollarSign className="w-3.5 h-3.5 text-blue-500" />
                Tarif (€) *
              </span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                name="tarif"
                value={formData.tarif}
                onChange={handleChange}
                onFocus={() => handleFocus("tarif")}
                onBlur={handleBlur}
                className={inputClasses("tarif")}
                min="0"
                placeholder="0.00"
              />
            </div>
            {errors.tarif && (
              <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                <span className="w-1 h-1 bg-red-500 rounded-full" />
                {errors.tarif}
              </p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiCalendar className="w-3.5 h-3.5 text-blue-500" />
                Date ouverture inscriptions *
              </span>
            </label>
            <div className="relative">
              <input
                type="date"
                name="date_ouverture_inscriptions"
                value={formData.date_ouverture_inscriptions}
                onChange={handleChange}
                onFocus={() => handleFocus("date_ouverture_inscriptions")}
                onBlur={handleBlur}
                className={inputClasses("date_ouverture_inscriptions")}
              />
            </div>
            {errors.date_ouverture_inscriptions && (
              <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                <span className="w-1 h-1 bg-red-500 rounded-full" />
                {errors.date_ouverture_inscriptions}
              </p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiClipboard className="w-3.5 h-3.5 text-blue-500" />
                Statut
              </span>
            </label>
            <div className="relative">
              <select
                name="statut"
                value={formData.statut}
                onChange={handleChange}
                onFocus={() => handleFocus("statut")}
                onBlur={handleBlur}
                className={inputClasses("statut")}
              >
                {STATUT_SORTIE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </motion.div>

          <motion.div {...fadeInUp} className="md:col-span-2">
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiFileText className="w-3.5 h-3.5 text-blue-500" />
                Description du site
              </span>
            </label>
            <div className="relative">
              <textarea
                name="description_site"
                value={formData.description_site}
                onChange={handleChange}
                onFocus={() => handleFocus("description_site")}
                onBlur={handleBlur}
                rows="3"
                className={inputClasses("description_site")}
                placeholder="Décrivez le site de plongée..."
              />
            </div>
          </motion.div>

          <motion.div {...fadeInUp} className="md:col-span-2">
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiInfo className="w-3.5 h-3.5 text-blue-500" />
                Conditions d'affectation
              </span>
            </label>
            <div className="relative">
              <textarea
                name="condition_affectation"
                value={formData.condition_affectation}
                onChange={handleChange}
                onFocus={() => handleFocus("condition_affectation")}
                onBlur={handleBlur}
                rows="2"
                className={inputClasses("condition_affectation")}
                placeholder="Conditions spécifiques..."
              />
            </div>
          </motion.div>
        </div>
      </div>

      <div className="px-7 py-5 bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-800/50 dark:to-gray-900/50 border-t border-gray-100/80 dark:border-gray-800/80 flex flex-col sm:flex-row justify-end gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={() => navigate("/sorties")}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/70 dark:hover:bg-gray-700/50 rounded-xl transition-all duration-300"
        >
          <FiX className="w-4 h-4" />
          Annuler
        </motion.button>

        <motion.button
          whileHover={{
            scale: 1.03,
            boxShadow: "0 8px 30px rgba(59,130,246,0.4)",
          }}
          whileTap={{ scale: 0.97 }}
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-7 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-700 hover:via-blue-700 hover:to-indigo-700 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
          ) : (
            <FiSave className="w-4 h-4" />
          )}
          {editMode ? "Mettre à jour" : "Créer la sortie"}
          <FiChevronRight className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.form>
  );
};

export default SortieForm;
