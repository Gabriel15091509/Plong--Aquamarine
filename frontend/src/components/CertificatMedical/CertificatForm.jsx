import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  FiUser,
  FiFileText,
  FiCalendar,
  FiUserCheck,
  FiSave,
  FiX,
  FiChevronRight,
  FiHeart,
  FiClock,
  FiAward,
  FiBriefcase,
} from "react-icons/fi";
import { useCertificats } from "../../hooks/useCertificats";
import { useAdherents } from "../../hooks/useAdherents";
import LoadingSpinner from "../Common/LoadingSpinner";
import SearchableSelect from "../Common/SearchableSelect";

const CERTIFICAT_TYPES = ["Médical", "Sportif", "Plongée", "Révision"];
const CERTIFICAT_STATUS = ["Valide", "Expiré", "En attente"];

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

const CertificatForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const editMode = !!id;

  const { useGetById, useCreate, useUpdate } = useCertificats();
  const { useGetAll } = useAdherents();

  const { data: certificatData, isLoading: loadingData } = useGetById(id);
  const { data: adherentsData, isLoading: loadingAdherents } = useGetAll();

  const create = useCreate();
  const update = useUpdate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [focused, setFocused] = useState(null);

  const [formData, setFormData] = useState({
    num_adherent: "",
    type_certificat: "Plongée",
    date_validite: "",
    date_delivrance: new Date().toISOString().split("T")[0],
    medecin: "",
    statut: "Valide",
  });

  useEffect(() => {
    if (editMode && id && certificatData?.data) {
      const cert = certificatData.data;
      setFormData({
        num_adherent: cert.num_adherent || "",
        type_certificat: cert.type_certificat || "Plongée",
        date_validite: cert.date_validite
          ? cert.date_validite.split("T")[0]
          : "",
        date_delivrance: cert.date_delivrance
          ? cert.date_delivrance.split("T")[0]
          : "",
        medecin: cert.medecin || "",
        statut: cert.statut || "Valide",
      });
    }
  }, [editMode, id, certificatData]);

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
    if (!formData.type_certificat)
      newErrors.type_certificat = "Le type est requis";
    if (!formData.date_validite)
      newErrors.date_validite = "La date de validité est requise";
    if (!formData.medecin) newErrors.medecin = "Le médecin est requis";
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
        toast.success("Certificat modifié avec succès");
      } else {
        await create.mutateAsync(formData);
        toast.success("Certificat créé avec succès");
      }
      navigate("/certificats");
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
              {editMode ? "Modifier le certificat" : "Nouveau certificat"}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-sm text-cyan-100/80 mt-0.5 font-light"
            >
              {editMode
                ? "Mettez à jour les informations du certificat"
                : "Ajoutez un nouveau certificat médical"}
            </motion.p>
          </div>
          <motion.div
            variants={floatIcon}
            initial="initial"
            animate="animate"
            className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 shadow-xl"
          >
            <FiHeart className="w-7 h-7 text-white" />
          </motion.div>
        </div>
      </div>

      <div className="p-7 space-y-7">
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
                <FiFileText className="w-3.5 h-3.5 text-blue-500" />
                Type *
              </span>
            </label>
            <div className="relative">
              <select
                name="type_certificat"
                value={formData.type_certificat}
                onChange={handleChange}
                onFocus={() => handleFocus("type_certificat")}
                onBlur={handleBlur}
                className={inputClasses("type_certificat")}
              >
                {CERTIFICAT_TYPES.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            {errors.type_certificat && (
              <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                <span className="w-1 h-1 bg-red-500 rounded-full" />
                {errors.type_certificat}
              </p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiCalendar className="w-3.5 h-3.5 text-blue-500" />
                Date de validité *
              </span>
            </label>
            <div className="relative">
              <input
                type="date"
                name="date_validite"
                value={formData.date_validite}
                onChange={handleChange}
                onFocus={() => handleFocus("date_validite")}
                onBlur={handleBlur}
                className={inputClasses("date_validite")}
              />
            </div>
            {errors.date_validite && (
              <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                <span className="w-1 h-1 bg-red-500 rounded-full" />
                {errors.date_validite}
              </p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiClock className="w-3.5 h-3.5 text-blue-500" />
                Date de délivrance
              </span>
            </label>
            <div className="relative">
              <input
                type="date"
                name="date_delivrance"
                value={formData.date_delivrance}
                onChange={handleChange}
                onFocus={() => handleFocus("date_delivrance")}
                onBlur={handleBlur}
                className={inputClasses("date_delivrance")}
              />
            </div>
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiBriefcase className="w-3.5 h-3.5 text-blue-500" />
                Médecin *
              </span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="medecin"
                value={formData.medecin}
                onChange={handleChange}
                onFocus={() => handleFocus("medecin")}
                onBlur={handleBlur}
                className={inputClasses("medecin")}
                placeholder="Dr. Dupont"
              />
            </div>
            {errors.medecin && (
              <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                <span className="w-1 h-1 bg-red-500 rounded-full" />
                {errors.medecin}
              </p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiAward className="w-3.5 h-3.5 text-blue-500" />
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
                {CERTIFICAT_STATUS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="px-7 py-5 bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-800/50 dark:to-gray-900/50 border-t border-gray-100/80 dark:border-gray-800/80 flex flex-col sm:flex-row justify-end gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={() => navigate("/certificats")}
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
          {editMode ? "Mettre à jour" : "Créer le certificat"}
          <FiChevronRight className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.form>
  );
};

export default CertificatForm;
