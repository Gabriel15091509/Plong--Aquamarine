import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  FiPackage,
  FiTag,
  FiAward,
  FiBox,
  FiMaximize,
  FiActivity,
  FiCalendar,
  FiTool,
  FiMapPin,
  FiSave,
  FiX,
  FiClipboard,
  FiCheckCircle,
  FiClock,
  FiHash,
} from "react-icons/fi";
import { useMateriels } from "../../hooks/useMateriels";
import LoadingSpinner from "../Common/LoadingSpinner";
import {
  CATEGORIE_MATERIEL_OPTIONS,
  ETAT_MATERIEL_OPTIONS,
} from "../../utils/constants";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

const MaterielForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const editMode = !!id;

  const { useGetById, useCreate, useUpdate } = useMateriels();

  const { data: materielData, isLoading: loadingData } = useGetById(id);

  const create = useCreate();
  const update = useUpdate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [focused, setFocused] = useState(null);

  const [formData, setFormData] = useState({
    num_inventaire: "",
    categorie: "Bloc",
    marque: "",
    modele: "",
    taille: "",
    epaisseur: "",
    date_achat: "",
    etat: "Bon",
    localisation: "",
    date_verif_visuelle: "",
    date_revision_technique: "",
    date_prochaine_echeance: "",
  });

  useEffect(() => {
    if (editMode && id && materielData?.data) {
      const m = materielData.data;
      setFormData({
        num_inventaire: m.num_inventaire || "",
        categorie: m.categorie || "Bloc",
        marque: m.marque || "",
        modele: m.modele || "",
        taille: m.taille || "",
        epaisseur: m.epaisseur || "",
        date_achat: m.date_achat ? m.date_achat.split("T")[0] : "",
        etat: m.etat || "Bon",
        localisation: m.localisation || "",
        date_verif_visuelle: m.date_verif_visuelle
          ? m.date_verif_visuelle.split("T")[0]
          : "",
        date_revision_technique: m.date_revision_technique
          ? m.date_revision_technique.split("T")[0]
          : "",
        date_prochaine_echeance: m.date_prochaine_echeance
          ? m.date_prochaine_echeance.split("T")[0]
          : "",
      });
    }
  }, [editMode, id, materielData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFocus = (name) => setFocused(name);
  const handleBlur = () => setFocused(null);

  const validate = () => {
    const newErrors = {};
    if (!formData.num_inventaire)
      newErrors.num_inventaire = "Le numéro d'inventaire est requis";
    if (!formData.categorie) newErrors.categorie = "La catégorie est requise";
    if (!formData.marque) newErrors.marque = "La marque est requise";
    if (!formData.modele) newErrors.modele = "Le modèle est requis";
    if (!formData.date_achat)
      newErrors.date_achat = "La date d'achat est requise";
    if (!formData.localisation)
      newErrors.localisation = "La localisation est requise";
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
        toast.success("Matériel modifié avec succès");
      } else {
        await create.mutateAsync(formData);
        toast.success("Matériel créé avec succès");
      }
      navigate("/materiels");
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
              {editMode ? "Modifier le matériel" : "Nouveau matériel"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {editMode
                ? "Mettez à jour les informations du matériel"
                : "Ajoutez un nouvel équipement"}
            </p>
          </div>
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
            <FiPackage className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </div>

      {/* Corps du formulaire */}
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiHash className="w-4 h-4 text-gray-400" />
                N° Inventaire *
              </span>
            </label>
            <input
              type="text"
              name="num_inventaire"
              value={formData.num_inventaire}
              onChange={handleChange}
              disabled={editMode}
              onFocus={() => handleFocus("num_inventaire")}
              onBlur={handleBlur}
              className={inputClasses("num_inventaire")}
              placeholder="INV-2024-001"
            />
            {errors.num_inventaire && (
              <p className="mt-1.5 text-sm text-red-500">
                {errors.num_inventaire}
              </p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiTag className="w-4 h-4 text-gray-400" />
                Catégorie *
              </span>
            </label>
            <select
              name="categorie"
              value={formData.categorie}
              onChange={handleChange}
              onFocus={() => handleFocus("categorie")}
              onBlur={handleBlur}
              className={inputClasses("categorie")}
            >
              {CATEGORIE_MATERIEL_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            {errors.categorie && (
              <p className="mt-1.5 text-sm text-red-500">{errors.categorie}</p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiAward className="w-4 h-4 text-gray-400" />
                Marque *
              </span>
            </label>
            <input
              type="text"
              name="marque"
              value={formData.marque}
              onChange={handleChange}
              onFocus={() => handleFocus("marque")}
              onBlur={handleBlur}
              className={inputClasses("marque")}
              placeholder="Scubapro"
            />
            {errors.marque && (
              <p className="mt-1.5 text-sm text-red-500">{errors.marque}</p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiBox className="w-4 h-4 text-gray-400" />
                Modèle *
              </span>
            </label>
            <input
              type="text"
              name="modele"
              value={formData.modele}
              onChange={handleChange}
              onFocus={() => handleFocus("modele")}
              onBlur={handleBlur}
              className={inputClasses("modele")}
              placeholder="MK25 EVO"
            />
            {errors.modele && (
              <p className="mt-1.5 text-sm text-red-500">{errors.modele}</p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiMaximize className="w-4 h-4 text-gray-400" />
                Taille
              </span>
            </label>
            <input
              type="text"
              name="taille"
              value={formData.taille}
              onChange={handleChange}
              onFocus={() => handleFocus("taille")}
              onBlur={handleBlur}
              className={inputClasses("taille")}
              placeholder="L"
            />
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiActivity className="w-4 h-4 text-gray-400" />
                Épaisseur
              </span>
            </label>
            <input
              type="text"
              name="epaisseur"
              value={formData.epaisseur}
              onChange={handleChange}
              onFocus={() => handleFocus("epaisseur")}
              onBlur={handleBlur}
              className={inputClasses("epaisseur")}
              placeholder="5mm"
            />
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiCalendar className="w-4 h-4 text-gray-400" />
                Date d'achat *
              </span>
            </label>
            <input
              type="date"
              name="date_achat"
              value={formData.date_achat}
              onChange={handleChange}
              onFocus={() => handleFocus("date_achat")}
              onBlur={handleBlur}
              className={inputClasses("date_achat")}
            />
            {errors.date_achat && (
              <p className="mt-1.5 text-sm text-red-500">{errors.date_achat}</p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiCheckCircle className="w-4 h-4 text-gray-400" />
                État *
              </span>
            </label>
            <select
              name="etat"
              value={formData.etat}
              onChange={handleChange}
              onFocus={() => handleFocus("etat")}
              onBlur={handleBlur}
              className={inputClasses("etat")}
            >
              {ETAT_MATERIEL_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            {errors.etat && (
              <p className="mt-1.5 text-sm text-red-500">{errors.etat}</p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiMapPin className="w-4 h-4 text-gray-400" />
                Localisation *
              </span>
            </label>
            <input
              type="text"
              name="localisation"
              value={formData.localisation}
              onChange={handleChange}
              onFocus={() => handleFocus("localisation")}
              onBlur={handleBlur}
              className={inputClasses("localisation")}
              placeholder="Local 1 - Étagère 3"
            />
            {errors.localisation && (
              <p className="mt-1.5 text-sm text-red-500">
                {errors.localisation}
              </p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiTool className="w-4 h-4 text-gray-400" />
                Date vérification visuelle
              </span>
            </label>
            <input
              type="date"
              name="date_verif_visuelle"
              value={formData.date_verif_visuelle}
              onChange={handleChange}
              onFocus={() => handleFocus("date_verif_visuelle")}
              onBlur={handleBlur}
              className={inputClasses("date_verif_visuelle")}
            />
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiClipboard className="w-4 h-4 text-gray-400" />
                Date révision technique
              </span>
            </label>
            <input
              type="date"
              name="date_revision_technique"
              value={formData.date_revision_technique}
              onChange={handleChange}
              onFocus={() => handleFocus("date_revision_technique")}
              onBlur={handleBlur}
              className={inputClasses("date_revision_technique")}
            />
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiClock className="w-4 h-4 text-gray-400" />
                Date prochaine échéance
              </span>
            </label>
            <input
              type="date"
              name="date_prochaine_echeance"
              value={formData.date_prochaine_echeance}
              onChange={handleChange}
              onFocus={() => handleFocus("date_prochaine_echeance")}
              onBlur={handleBlur}
              className={inputClasses("date_prochaine_echeance")}
            />
          </motion.div>
        </div>
      </div>

      {/* Pied de page */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-end gap-3">
        <button
          type="button"
          onClick={() => navigate("/materiels")}
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
          {editMode ? "Mettre à jour" : "Créer le matériel"}
        </button>
      </div>
    </motion.form>
  );
};

export default MaterielForm;
