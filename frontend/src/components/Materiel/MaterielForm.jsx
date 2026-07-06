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
  FiChevronRight,
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
  transition: { duration: 0.4 },
};

const floatIcon = {
  initial: { y: 0 },
  animate: {
    y: [0, -5, 0],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
  },
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
              {editMode ? "Modifier le matériel" : "Nouveau matériel"}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-sm text-cyan-100/80 mt-0.5 font-light"
            >
              {editMode
                ? "Mettez à jour les informations du matériel"
                : "Ajoutez un nouvel équipement"}
            </motion.p>
          </div>
          <motion.div
            variants={floatIcon}
            initial="initial"
            animate="animate"
            className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 shadow-xl"
          >
            <FiPackage className="w-7 h-7 text-white" />
          </motion.div>
        </div>
      </div>

      <div className="p-7 space-y-7">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiHash className="w-3.5 h-3.5 text-blue-500" />
                N° Inventaire *
              </span>
            </label>
            <div className="relative">
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
            </div>
            {errors.num_inventaire && (
              <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                <span className="w-1 h-1 bg-red-500 rounded-full" />
                {errors.num_inventaire}
              </p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiTag className="w-3.5 h-3.5 text-blue-500" />
                Catégorie *
              </span>
            </label>
            <div className="relative">
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
            </div>
            {errors.categorie && (
              <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                <span className="w-1 h-1 bg-red-500 rounded-full" />
                {errors.categorie}
              </p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiAward className="w-3.5 h-3.5 text-blue-500" />
                Marque *
              </span>
            </label>
            <div className="relative">
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
            </div>
            {errors.marque && (
              <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                <span className="w-1 h-1 bg-red-500 rounded-full" />
                {errors.marque}
              </p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiBox className="w-3.5 h-3.5 text-blue-500" />
                Modèle *
              </span>
            </label>
            <div className="relative">
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
            </div>
            {errors.modele && (
              <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                <span className="w-1 h-1 bg-red-500 rounded-full" />
                {errors.modele}
              </p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiMaximize className="w-3.5 h-3.5 text-blue-500" />
                Taille
              </span>
            </label>
            <div className="relative">
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
            </div>
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiActivity className="w-3.5 h-3.5 text-blue-500" />
                Épaisseur
              </span>
            </label>
            <div className="relative">
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
            </div>
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiCalendar className="w-3.5 h-3.5 text-blue-500" />
                Date d'achat *
              </span>
            </label>
            <div className="relative">
              <input
                type="date"
                name="date_achat"
                value={formData.date_achat}
                onChange={handleChange}
                onFocus={() => handleFocus("date_achat")}
                onBlur={handleBlur}
                className={inputClasses("date_achat")}
              />
            </div>
            {errors.date_achat && (
              <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                <span className="w-1 h-1 bg-red-500 rounded-full" />
                {errors.date_achat}
              </p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiCheckCircle className="w-3.5 h-3.5 text-blue-500" />
                État *
              </span>
            </label>
            <div className="relative">
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
            </div>
            {errors.etat && (
              <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                <span className="w-1 h-1 bg-red-500 rounded-full" />
                {errors.etat}
              </p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiMapPin className="w-3.5 h-3.5 text-blue-500" />
                Localisation *
              </span>
            </label>
            <div className="relative">
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
            </div>
            {errors.localisation && (
              <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                <span className="w-1 h-1 bg-red-500 rounded-full" />
                {errors.localisation}
              </p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiTool className="w-3.5 h-3.5 text-blue-500" />
                Date vérification visuelle
              </span>
            </label>
            <div className="relative">
              <input
                type="date"
                name="date_verif_visuelle"
                value={formData.date_verif_visuelle}
                onChange={handleChange}
                onFocus={() => handleFocus("date_verif_visuelle")}
                onBlur={handleBlur}
                className={inputClasses("date_verif_visuelle")}
              />
            </div>
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiClipboard className="w-3.5 h-3.5 text-blue-500" />
                Date révision technique
              </span>
            </label>
            <div className="relative">
              <input
                type="date"
                name="date_revision_technique"
                value={formData.date_revision_technique}
                onChange={handleChange}
                onFocus={() => handleFocus("date_revision_technique")}
                onBlur={handleBlur}
                className={inputClasses("date_revision_technique")}
              />
            </div>
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiClock className="w-3.5 h-3.5 text-blue-500" />
                Date prochaine échéance
              </span>
            </label>
            <div className="relative">
              <input
                type="date"
                name="date_prochaine_echeance"
                value={formData.date_prochaine_echeance}
                onChange={handleChange}
                onFocus={() => handleFocus("date_prochaine_echeance")}
                onBlur={handleBlur}
                className={inputClasses("date_prochaine_echeance")}
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
          onClick={() => navigate("/materiels")}
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
          {editMode ? "Mettre à jour" : "Créer le matériel"}
          <FiChevronRight className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.form>
  );
};

export default MaterielForm;
