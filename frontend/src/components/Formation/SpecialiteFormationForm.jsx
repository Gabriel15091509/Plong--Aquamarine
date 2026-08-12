import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiAward,
  FiCalendar,
  FiCheckCircle,
  FiFileText,
  FiSave,
  FiX,
  FiBookOpen,
} from "react-icons/fi";
import { useSpecialitesFormation } from "../../hooks/Formation/useSpecialitesFormation";
import { useAdherents } from "../../hooks/Adherent/useAdherents";
import { useMoniteurs } from "../../hooks/Moniteur/useMoniteurs";
import LoadingSpinner from "../Common/LoadingSpinner";
import SearchableSelect from "../Common/SearchableSelect";
import {
  TYPE_SPECIALITE_OPTIONS,
  STATUT_SPECIALITE_OPTIONS,
} from "../../utils/constants";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

const SpecialiteFormationForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const editMode = !!id;

  const { useGetById, useCreate, useUpdate } = useSpecialitesFormation();
  const { useGetAll } = useAdherents();
  const { useGetAll: useGetAllMoniteurs } = useMoniteurs();

  const { data, isLoading: loadingData } = useGetById(id);
  const { data: adherentsData, isLoading: loadingAdherents } = useGetAll();
  const { data: moniteursData, isLoading: loadingMoniteurs } = useGetAllMoniteurs();

  const create = useCreate();
  const update = useUpdate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [focused, setFocused] = useState(null);
  const submittingRef = useRef(false);

  const [formData, setFormData] = useState({
    num_adherent: "",
    id_moniteur: "",
    type_specialite: TYPE_SPECIALITE_OPTIONS[0],
    date_debut: "",
    date_obtention_prevue: "",
    statut: "En cours",
    commentaire: "",
  });

  useEffect(() => {
    if (editMode && id && data?.data) {
      const s = data.data;
      setFormData({
        num_adherent: s.num_adherent || "",
        id_moniteur: s.id_moniteur || "",
        type_specialite: s.type_specialite || TYPE_SPECIALITE_OPTIONS[0],
        date_debut: s.date_debut ? s.date_debut.split("T")[0] : "",
        date_obtention_prevue: s.date_obtention_prevue
          ? s.date_obtention_prevue.split("T")[0]
          : "",
        statut: s.statut || "En cours",
        commentaire: s.commentaire || "",
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
    if (!formData.num_adherent)
      newErrors.num_adherent = "L'adhérent est requis";
    if (!formData.id_moniteur)
      newErrors.id_moniteur = "Le moniteur responsable est requis";
    if (!formData.type_specialite)
      newErrors.type_specialite = "La spécialité est requise";
    if (!formData.date_debut)
      newErrors.date_debut = "La date de début est requise";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return;
    if (!validate()) return;
    submittingRef.current = true;
    setLoading(true);
    try {
      if (editMode && id) {
        await update.mutateAsync({ id, data: formData });
      } else {
        await create.mutateAsync(formData);
      }
      navigate("/specialites-formation");
    } catch (error) {
      console.error("Échec de l'enregistrement de la spécialité :", error);
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  if (editMode && loadingData) return <LoadingSpinner variant="form" />;
  if (loadingAdherents || loadingMoniteurs) return <LoadingSpinner variant="form" />;

  const moniteurOptions = (moniteursData?.data || []).map((m) => ({
    ...m,
    label: m.user?.name || `Moniteur #${m.id_moniteur}`,
  }));

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
      <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {editMode ? "Modifier la spécialité" : "Nouvelle spécialité"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {editMode
                ? "Mettez à jour cette formation de spécialité"
                : "Inscrivez un adhérent à une formation de spécialité"}
            </p>
          </div>
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
            <FiBookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </div>

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
            <SearchableSelect
              label="Moniteur responsable *"
              value={formData.id_moniteur}
              onChange={(value) => {
                setFormData((prev) => ({ ...prev, id_moniteur: value }));
                if (errors.id_moniteur)
                  setErrors((prev) => ({ ...prev, id_moniteur: "" }));
              }}
              options={moniteurOptions}
              getOptionLabel={(m) => m.label}
              getOptionValue={(m) => m.id_moniteur}
              placeholder="Rechercher un moniteur..."
              error={errors.id_moniteur}
              required={true}
            />
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiAward className="w-4 h-4 text-gray-400" />
                Spécialité *
              </span>
            </label>
            <select
              name="type_specialite"
              value={formData.type_specialite}
              onChange={handleChange}
              onFocus={() => handleFocus("type_specialite")}
              onBlur={handleBlur}
              className={inputClasses("type_specialite")}
            >
              {TYPE_SPECIALITE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiCheckCircle className="w-4 h-4 text-gray-400" />
                Statut
              </span>
            </label>
            <select
              name="statut"
              value={formData.statut}
              onChange={handleChange}
              onFocus={() => handleFocus("statut")}
              onBlur={handleBlur}
              className={inputClasses("statut")}
            >
              {STATUT_SPECIALITE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiCalendar className="w-4 h-4 text-gray-400" />
                Date début *
              </span>
            </label>
            <input
              type="date"
              name="date_debut"
              value={formData.date_debut}
              onChange={handleChange}
              onFocus={() => handleFocus("date_debut")}
              onBlur={handleBlur}
              className={inputClasses("date_debut")}
            />
            {errors.date_debut && (
              <p className="mt-1.5 text-sm text-red-500">{errors.date_debut}</p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiAward className="w-4 h-4 text-gray-400" />
                Date d&apos;obtention prévue
              </span>
            </label>
            <input
              type="date"
              name="date_obtention_prevue"
              value={formData.date_obtention_prevue}
              onChange={handleChange}
              onFocus={() => handleFocus("date_obtention_prevue")}
              onBlur={handleBlur}
              className={inputClasses("date_obtention_prevue")}
            />
          </motion.div>

          <motion.div {...fadeInUp} className="md:col-span-2">
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiFileText className="w-4 h-4 text-gray-400" />
                Commentaire
              </span>
            </label>
            <textarea
              name="commentaire"
              value={formData.commentaire}
              onChange={handleChange}
              onFocus={() => handleFocus("commentaire")}
              onBlur={handleBlur}
              rows="4"
              className={inputClasses("commentaire")}
              placeholder="Suivi, remarques..."
            />
          </motion.div>
        </div>
      </div>

      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-end gap-3">
        <button
          type="button"
          onClick={() => navigate("/specialites-formation")}
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
          {editMode ? "Mettre à jour" : "Créer la spécialité"}
        </button>
      </div>
    </motion.form>
  );
};

export default SpecialiteFormationForm;
