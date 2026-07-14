import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiAlertTriangle,
  FiSave,
  FiX,
  FiTag,
  FiFileText,
  FiTool,
} from "react-icons/fi";
import { useIncidents } from "../../hooks/useIncidents";
import { useSorties } from "../../hooks/useSorties";
import LoadingSpinner from "../Common/LoadingSpinner";
import SearchableSelect from "../Common/SearchableSelect";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

const TYPE_SUGGESTIONS = ["Materiel", "Medical", "Meteo", "Autre"];

const IncidentForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const editMode = !!id;

  const { useGetById, useCreate, useUpdate } = useIncidents();
  const { useGetAll } = useSorties();

  const { data: incidentData, isLoading: loadingData } = useGetById(id);
  const { data: sortiesData, isLoading: loadingSorties } = useGetAll();

  const create = useCreate();
  const update = useUpdate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    id_sortie: searchParams.get("id_sortie") || "",
    type: "",
    description: "",
    mesures_prises: "",
  });

  useEffect(() => {
    if (editMode && id && incidentData?.data) {
      const incident = incidentData.data;
      setFormData({
        id_sortie: incident.id_sortie || "",
        type: incident.type || "",
        description: incident.description || "",
        mesures_prises: incident.mesures_prises || "",
      });
    }
  }, [editMode, id, incidentData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.id_sortie) newErrors.id_sortie = "La sortie est requise";
    if (!formData.type) newErrors.type = "Le type est requis";
    if (!formData.description)
      newErrors.description = "La description est requise";
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
      } else {
        await create.mutateAsync(formData);
      }
      navigate("/incidents");
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (editMode && loadingData) return <LoadingSpinner />;
  if (loadingSorties) return <LoadingSpinner />;

  const inputClasses = (fieldName) =>
    `w-full pl-4 pr-4 py-2.5 text-sm border rounded-lg focus:outline-none transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
      errors[fieldName]
        ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200"
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
      <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {editMode ? "Modifier l'incident" : "Déclarer un incident"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {editMode
                ? "Mettez à jour les informations de l'incident"
                : "Signalez un incident survenu lors d'une sortie"}
            </p>
          </div>
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
            <FiAlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <motion.div {...fadeInUp}>
            <SearchableSelect
              label="Sortie concernée *"
              value={formData.id_sortie}
              onChange={(value) => {
                setFormData((prev) => ({ ...prev, id_sortie: value }));
                if (errors.id_sortie)
                  setErrors((prev) => ({ ...prev, id_sortie: "" }));
              }}
              options={sortiesData?.data || []}
              getOptionLabel={(s) =>
                `${s.type} - ${s.lieu} (${s.site || ""})`
              }
              getOptionValue={(s) => s.id_sortie}
              placeholder="Rechercher une sortie..."
              error={errors.id_sortie}
              required={true}
            />
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiTag className="w-4 h-4 text-gray-400" />
                Type *
              </span>
            </label>
            <input
              type="text"
              list="incident-type-suggestions"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className={inputClasses("type")}
              placeholder="Materiel, Medical, Meteo, Autre..."
            />
            <datalist id="incident-type-suggestions">
              {TYPE_SUGGESTIONS.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
            {errors.type && (
              <p className="mt-1.5 text-sm text-red-500">{errors.type}</p>
            )}
          </motion.div>

          <motion.div {...fadeInUp} className="md:col-span-2">
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiFileText className="w-4 h-4 text-gray-400" />
                Description *
              </span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className={inputClasses("description")}
              placeholder="Décrivez les circonstances de l'incident..."
            />
            {errors.description && (
              <p className="mt-1.5 text-sm text-red-500">
                {errors.description}
              </p>
            )}
          </motion.div>

          <motion.div {...fadeInUp} className="md:col-span-2">
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiTool className="w-4 h-4 text-gray-400" />
                Mesures prises
              </span>
            </label>
            <textarea
              name="mesures_prises"
              value={formData.mesures_prises}
              onChange={handleChange}
              rows={3}
              className={inputClasses("mesures_prises")}
              placeholder="Mesures déjà mises en œuvre (optionnel)..."
            />
          </motion.div>
        </div>
      </div>

      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-end gap-3">
        <button
          type="button"
          onClick={() => navigate("/incidents")}
          className="inline-flex items-center justify-center gap-2 px-5 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
        >
          <FiX className="w-4 h-4" />
          Annuler
        </button>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-6 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm hover:shadow disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
          ) : (
            <FiSave className="w-4 h-4" />
          )}
          {editMode ? "Mettre à jour" : "Déclarer l'incident"}
        </button>
      </div>
    </motion.form>
  );
};

export default IncidentForm;
