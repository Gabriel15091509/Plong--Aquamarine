import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  FiUser,
  FiCalendar,
  FiDollarSign,
  FiCreditCard,
  FiSave,
  FiX,
  FiChevronRight,
  FiTag,
  FiClock,
  FiHash,
} from "react-icons/fi";
import { useAdhesions } from "../../hooks/useAdhesions";
import { useAdherents } from "../../hooks/useAdherents";
import LoadingSpinner from "../Common/LoadingSpinner";
import SearchableSelect from "../Common/SearchableSelect";
import {
  TYPE_ADHESION_OPTIONS,
  STATUT_PAIEMENT_OPTIONS,
} from "../../utils/constants";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

const AdhesionForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const editMode = !!id;

  const { useGetById, useCreate, useUpdate } = useAdhesions();
  const { useGetAll } = useAdherents();

  const { data: adhesionData, isLoading: loadingData } = useGetById(id);
  const { data: adherentsData, isLoading: loadingAdherents } = useGetAll();

  const create = useCreate();
  const update = useUpdate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [focused, setFocused] = useState(null);

  const [formData, setFormData] = useState({
    num_adherent: "",
    type: "Adhésion annuelle",
    date_debut: "",
    date_fin: "",
    montant_paye: "",
    num_licence_ffesm: "",
    statut_paiement: "En attente",
    annee_adhesion: new Date().getFullYear(),
  });

  useEffect(() => {
    if (editMode && id && adhesionData?.data) {
      const adhesion = adhesionData.data;
      setFormData({
        num_adherent: adhesion.num_adherent || "",
        type: adhesion.type || "Adhésion annuelle",
        date_debut: adhesion.date_debut
          ? adhesion.date_debut.split("T")[0]
          : "",
        date_fin: adhesion.date_fin ? adhesion.date_fin.split("T")[0] : "",
        montant_paye: adhesion.montant_paye || "",
        num_licence_ffesm: adhesion.num_licence_ffesm || "",
        statut_paiement: adhesion.statut_paiement || "En attente",
        annee_adhesion: adhesion.annee_adhesion || new Date().getFullYear(),
      });
    }
  }, [editMode, id, adhesionData]);

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
    if (!formData.type) newErrors.type = "Le type est requis";
    if (!formData.date_debut)
      newErrors.date_debut = "La date de début est requise";
    if (!formData.date_fin) newErrors.date_fin = "La date de fin est requise";
    if (!formData.montant_paye || formData.montant_paye <= 0) {
      newErrors.montant_paye = "Le montant doit être supérieur à 0";
    }
    if (!formData.annee_adhesion)
      newErrors.annee_adhesion = "L'année est requise";
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
        toast.success("Adhésion modifiée avec succès");
      } else {
        await create.mutateAsync(formData);
        toast.success("Adhésion créée avec succès");
      }
      navigate("/adhesions");
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
              {editMode ? "Modifier l'adhésion" : "Nouvelle adhésion"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {editMode
                ? "Mettez à jour les informations d'adhésion"
                : "Ajoutez une nouvelle adhésion au club"}
            </p>
          </div>
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
            <FiCreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
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
                <FiTag className="w-4 h-4 text-gray-400" />
                Type *
              </span>
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              onFocus={() => handleFocus("type")}
              onBlur={handleBlur}
              className={inputClasses("type")}
            >
              {TYPE_ADHESION_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            {errors.type && (
              <p className="mt-1.5 text-sm text-red-500">{errors.type}</p>
            )}
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
                <FiCalendar className="w-4 h-4 text-gray-400" />
                Date fin *
              </span>
            </label>
            <input
              type="date"
              name="date_fin"
              value={formData.date_fin}
              onChange={handleChange}
              onFocus={() => handleFocus("date_fin")}
              onBlur={handleBlur}
              className={inputClasses("date_fin")}
            />
            {errors.date_fin && (
              <p className="mt-1.5 text-sm text-red-500">{errors.date_fin}</p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiDollarSign className="w-4 h-4 text-gray-400" />
                Montant (€) *
              </span>
            </label>
            <input
              type="number"
              step="0.01"
              name="montant_paye"
              value={formData.montant_paye}
              onChange={handleChange}
              onFocus={() => handleFocus("montant_paye")}
              onBlur={handleBlur}
              className={inputClasses("montant_paye")}
              placeholder="0.00"
            />
            {errors.montant_paye && (
              <p className="mt-1.5 text-sm text-red-500">
                {errors.montant_paye}
              </p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiClock className="w-4 h-4 text-gray-400" />
                Statut paiement
              </span>
            </label>
            <select
              name="statut_paiement"
              value={formData.statut_paiement}
              onChange={handleChange}
              onFocus={() => handleFocus("statut_paiement")}
              onBlur={handleBlur}
              className={inputClasses("statut_paiement")}
            >
              {STATUT_PAIEMENT_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiHash className="w-4 h-4 text-gray-400" />
                N° Licence FFESM
              </span>
            </label>
            <input
              type="text"
              name="num_licence_ffesm"
              value={formData.num_licence_ffesm}
              onChange={handleChange}
              onFocus={() => handleFocus("num_licence_ffesm")}
              onBlur={handleBlur}
              className={inputClasses("num_licence_ffesm")}
              placeholder="FFESM-2024-XXXX"
            />
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiCalendar className="w-4 h-4 text-gray-400" />
                Année *
              </span>
            </label>
            <input
              type="number"
              name="annee_adhesion"
              value={formData.annee_adhesion}
              onChange={handleChange}
              onFocus={() => handleFocus("annee_adhesion")}
              onBlur={handleBlur}
              className={inputClasses("annee_adhesion")}
              placeholder="2024"
            />
            {errors.annee_adhesion && (
              <p className="mt-1.5 text-sm text-red-500">
                {errors.annee_adhesion}
              </p>
            )}
          </motion.div>
        </div>
      </div>

      {/* Pied de page */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-end gap-3">
        <button
          type="button"
          onClick={() => navigate("/adhesions")}
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
          {editMode ? "Mettre à jour" : "Créer l'adhésion"}
        </button>
      </div>
    </motion.form>
  );
};

export default AdhesionForm;
