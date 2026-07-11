import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  FiUser,
  FiCalendar,
  FiDroplet,
  FiClock,
  FiThermometer,
  FiEye,
  FiTag,
  FiImage,
  FiFileText,
  FiCheckCircle,
  FiSave,
  FiX,
  FiActivity,
} from "react-icons/fi";
import { usePlongees } from "../../hooks/usePlongees";
import { useAdherents } from "../../hooks/useAdherents";
import LoadingSpinner from "../Common/LoadingSpinner";
import SearchableSelect from "../Common/SearchableSelect";
import { TYPE_PLONGEE_OPTIONS } from "../../utils/constants";

const VISIBILITE_OPTIONS = [
  "Très bonne",
  "Bonne",
  "Moyenne",
  "Mauvaise",
  "Très mauvaise",
];

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

const PlongeeForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const editMode = !!id;

  const { useGetById, useCreate, useUpdate } = usePlongees();
  const { useGetAll } = useAdherents();

  const { data, isLoading: loadingData } = useGetById(id);
  const { data: adherentsData, isLoading: loadingAdherents } = useGetAll();

  const create = useCreate();
  const update = useUpdate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [focused, setFocused] = useState(null);

  const [formData, setFormData] = useState({
    num_adherent: "",
    date: "",
    profondeur_max: "",
    duree: "",
    temperature_eau: "",
    visibilite: "Bonne",
    type_plongee: "Loisir",
    observations_faune: "",
    valide_moniteur: false,
    lien_photos: "",
  });

  useEffect(() => {
    if (editMode && id && data?.data) {
      const p = data.data;
      setFormData({
        num_adherent: p.num_adherent || "",
        date: p.date ? p.date.split("T")[0] : "",
        profondeur_max: p.profondeur_max || "",
        duree: p.duree || "",
        temperature_eau: p.temperature_eau || "",
        visibilite: p.visibilite || "Bonne",
        type_plongee: p.type_plongee || "Loisir",
        observations_faune: p.observations_faune || "",
        valide_moniteur: p.valide_moniteur || false,
        lien_photos: p.lien_photos || "",
      });
    }
  }, [editMode, id, data]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFocus = (name) => setFocused(name);
  const handleBlur = () => setFocused(null);

  const validate = () => {
    const newErrors = {};
    if (!formData.num_adherent)
      newErrors.num_adherent = "L'adhérent est requis";
    if (!formData.date) newErrors.date = "La date est requise";
    if (!formData.profondeur_max || formData.profondeur_max <= 0)
      newErrors.profondeur_max = "La profondeur est requise";
    if (!formData.duree || formData.duree <= 0)
      newErrors.duree = "La durée est requise";
    if (!formData.type_plongee) newErrors.type_plongee = "Le type est requis";
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
        toast.success("Plongée modifiée avec succès");
      } else {
        await create.mutateAsync(formData);
        toast.success("Plongée créée avec succès");
      }
      navigate("/plongees");
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
  if (loadingAdherents) return <LoadingSpinner />;

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
              {editMode ? "Modifier la plongée" : "Nouvelle plongée"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {editMode
                ? "Mettez à jour les informations de la plongée"
                : "Enregistrez une nouvelle plongée"}
            </p>
          </div>
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
            <FiActivity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </div>

      {/* Corps du formulaire */}
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <motion.div {...fadeInUp}>
            <SearchableSelect
              label="Adhérent *"
              value={formData.num_adherent}
              onChange={(value) => {
                setFormData((prev) => ({ ...prev, num_adherent: value }));
                if (errors.num_adherent)
                  setErrors((prev) => ({ ...prev, num_adherent: "" }));
              }}
              options={adherentsData?.data || []}
              getOptionLabel={(a) =>
                `${a.civilite} ${a.nom} ${a.prenom} - ${a.email}`
              }
              getOptionValue={(a) => a.num_adherent}
              placeholder="Rechercher un adhérent..."
              error={errors.num_adherent}
              required={true}
            />
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiCalendar className="w-4 h-4 text-gray-400" />
                Date *
              </span>
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              onFocus={() => handleFocus("date")}
              onBlur={handleBlur}
              className={inputClasses("date")}
            />
            {errors.date && (
              <p className="mt-1.5 text-sm text-red-500">{errors.date}</p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiDroplet className="w-4 h-4 text-gray-400" />
                Profondeur max (m) *
              </span>
            </label>
            <input
              type="number"
              name="profondeur_max"
              value={formData.profondeur_max}
              onChange={handleChange}
              onFocus={() => handleFocus("profondeur_max")}
              onBlur={handleBlur}
              className={inputClasses("profondeur_max")}
              min="0"
              placeholder="0"
            />
            {errors.profondeur_max && (
              <p className="mt-1.5 text-sm text-red-500">
                {errors.profondeur_max}
              </p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiClock className="w-4 h-4 text-gray-400" />
                Durée (minutes) *
              </span>
            </label>
            <input
              type="number"
              name="duree"
              value={formData.duree}
              onChange={handleChange}
              onFocus={() => handleFocus("duree")}
              onBlur={handleBlur}
              className={inputClasses("duree")}
              min="0"
              placeholder="0"
            />
            {errors.duree && (
              <p className="mt-1.5 text-sm text-red-500">{errors.duree}</p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiThermometer className="w-4 h-4 text-gray-400" />
                Température de l'eau (°C)
              </span>
            </label>
            <input
              type="number"
              step="0.1"
              name="temperature_eau"
              value={formData.temperature_eau}
              onChange={handleChange}
              onFocus={() => handleFocus("temperature_eau")}
              onBlur={handleBlur}
              className={inputClasses("temperature_eau")}
              placeholder="0.0"
            />
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiEye className="w-4 h-4 text-gray-400" />
                Visibilité
              </span>
            </label>
            <select
              name="visibilite"
              value={formData.visibilite}
              onChange={handleChange}
              onFocus={() => handleFocus("visibilite")}
              onBlur={handleBlur}
              className={inputClasses("visibilite")}
            >
              {VISIBILITE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiTag className="w-4 h-4 text-gray-400" />
                Type de plongée *
              </span>
            </label>
            <select
              name="type_plongee"
              value={formData.type_plongee}
              onChange={handleChange}
              onFocus={() => handleFocus("type_plongee")}
              onBlur={handleBlur}
              className={inputClasses("type_plongee")}
            >
              {TYPE_PLONGEE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            {errors.type_plongee && (
              <p className="mt-1.5 text-sm text-red-500">
                {errors.type_plongee}
              </p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiImage className="w-4 h-4 text-gray-400" />
                Lien photos
              </span>
            </label>
            <input
              type="text"
              name="lien_photos"
              value={formData.lien_photos}
              onChange={handleChange}
              onFocus={() => handleFocus("lien_photos")}
              onBlur={handleBlur}
              className={inputClasses("lien_photos")}
              placeholder="https://..."
            />
          </motion.div>

          <motion.div {...fadeInUp} className="md:col-span-2">
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiFileText className="w-4 h-4 text-gray-400" />
                Observations
              </span>
            </label>
            <textarea
              name="observations_faune"
              value={formData.observations_faune}
              onChange={handleChange}
              onFocus={() => handleFocus("observations_faune")}
              onBlur={handleBlur}
              rows="3"
              className={inputClasses("observations_faune")}
              placeholder="Observations de la faune..."
            />
          </motion.div>

          <motion.div {...fadeInUp} className="md:col-span-2">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                name="valide_moniteur"
                checked={formData.valide_moniteur}
                onChange={handleChange}
                className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all cursor-pointer"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors flex items-center gap-2">
                <FiCheckCircle className="w-4 h-4 text-blue-500" />
                Validée par le moniteur
              </span>
            </label>
          </motion.div>
        </div>
      </div>

      {/* Pied de page */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-end gap-3">
        <button
          type="button"
          onClick={() => navigate("/plongees")}
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
          {editMode ? "Mettre à jour" : "Créer la plongée"}
        </button>
      </div>
    </motion.form>
  );
};

export default PlongeeForm;
