import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiAward,
  FiUsers,
  FiFileText,
  FiSave,
  FiX,
  FiChevronRight,
  FiUserPlus,
  FiBriefcase,
  FiHeart,
} from "react-icons/fi";
import { useAdherents } from "../../hooks/useAdherents";
import LoadingSpinner from "../Common/LoadingSpinner";

const CIVILITE_OPTIONS = ["M.", "Mme", "Mlle"];
const NIVEAU_OPTIONS = ["Débutant", "Confirmé", "Expert", "Moniteur"];

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

const AdherentForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const editMode = !!id;

  const { useGetById, useCreate, useUpdate } = useAdherents();
  const { data, isLoading: loadingData } = useGetById(id);
  const create = useCreate();
  const update = useUpdate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [focused, setFocused] = useState(null);

  const [formData, setFormData] = useState({
    civilite: "M.",
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    adresse: "",
    code_postal: "",
    ville: "",
    date_naissance: "",
    niveau: "Débutant",
    date_adhesion: "",
    profession: "",
    numero_licence: "",
    situation_familiale: "",
    remarques: "",
  });

  useEffect(() => {
    if (editMode && id && data?.data) {
      const a = data.data;
      setFormData({
        civilite: a.civilite || "M.",
        nom: a.nom || "",
        prenom: a.prenom || "",
        email: a.email || "",
        telephone: a.telephone || "",
        adresse: a.adresse || "",
        code_postal: a.code_postal || "",
        ville: a.ville || "",
        date_naissance: a.date_naissance ? a.date_naissance.split("T")[0] : "",
        niveau: a.niveau || "Débutant",
        date_adhesion: a.date_adhesion ? a.date_adhesion.split("T")[0] : "",
        profession: a.profession || "",
        numero_licence: a.numero_licence || "",
        situation_familiale: a.situation_familiale || "",
        remarques: a.remarques || "",
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
    if (!formData.nom) newErrors.nom = "Le nom est requis";
    if (!formData.prenom) newErrors.prenom = "Le prénom est requis";
    if (!formData.email) {
      newErrors.email = "L'email est requis";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email invalide";
    }
    if (!formData.telephone) newErrors.telephone = "Le téléphone est requis";
    if (!formData.date_naissance)
      newErrors.date_naissance = "La date de naissance est requise";
    if (!formData.date_adhesion)
      newErrors.date_adhesion = "La date d'adhésion est requise";
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
        toast.success("Adhérent modifié avec succès");
      } else {
        await create.mutateAsync(formData);
        toast.success("Adhérent créé avec succès");
      }
      navigate("/adherents");
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
              {editMode ? "Modifier l'adhérent" : "Nouvel adhérent"}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-sm text-cyan-100/80 mt-0.5 font-light"
            >
              {editMode
                ? "Mettez à jour les informations de l'adhérent"
                : "Ajoutez un nouveau membre au club"}
            </motion.p>
          </div>
          <motion.div
            variants={floatIcon}
            initial="initial"
            animate="animate"
            className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 shadow-xl"
          >
            <FiUserPlus className="w-7 h-7 text-white" />
          </motion.div>
        </div>
      </div>

      <div className="p-7 space-y-7">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiUser className="w-3.5 h-3.5 text-blue-500" />
                Civilité
              </span>
            </label>
            <div className="relative">
              <select
                name="civilite"
                value={formData.civilite}
                onChange={handleChange}
                onFocus={() => handleFocus("civilite")}
                onBlur={handleBlur}
                className={inputClasses("civilite")}
              >
                {CIVILITE_OPTIONS.map((opt) => (
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
                <FiUser className="w-3.5 h-3.5 text-blue-500" />
                Nom *
              </span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                onFocus={() => handleFocus("nom")}
                onBlur={handleBlur}
                className={inputClasses("nom")}
                placeholder="Dupont"
              />
            </div>
            {errors.nom && (
              <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                <span className="w-1 h-1 bg-red-500 rounded-full" />
                {errors.nom}
              </p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiUser className="w-3.5 h-3.5 text-blue-500" />
                Prénom *
              </span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="prenom"
                value={formData.prenom}
                onChange={handleChange}
                onFocus={() => handleFocus("prenom")}
                onBlur={handleBlur}
                className={inputClasses("prenom")}
                placeholder="Jean"
              />
            </div>
            {errors.prenom && (
              <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                <span className="w-1 h-1 bg-red-500 rounded-full" />
                {errors.prenom}
              </p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiMail className="w-3.5 h-3.5 text-blue-500" />
                Email *
              </span>
            </label>
            <div className="relative">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onFocus={() => handleFocus("email")}
                onBlur={handleBlur}
                className={inputClasses("email")}
                placeholder="jean.dupont@email.com"
              />
            </div>
            {errors.email && (
              <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                <span className="w-1 h-1 bg-red-500 rounded-full" />
                {errors.email}
              </p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiPhone className="w-3.5 h-3.5 text-blue-500" />
                Téléphone *
              </span>
            </label>
            <div className="relative">
              <input
                type="tel"
                name="telephone"
                value={formData.telephone}
                onChange={handleChange}
                onFocus={() => handleFocus("telephone")}
                onBlur={handleBlur}
                className={inputClasses("telephone")}
                placeholder="06 12 34 56 78"
              />
            </div>
            {errors.telephone && (
              <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                <span className="w-1 h-1 bg-red-500 rounded-full" />
                {errors.telephone}
              </p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiCalendar className="w-3.5 h-3.5 text-blue-500" />
                Date de naissance *
              </span>
            </label>
            <div className="relative">
              <input
                type="date"
                name="date_naissance"
                value={formData.date_naissance}
                onChange={handleChange}
                onFocus={() => handleFocus("date_naissance")}
                onBlur={handleBlur}
                className={inputClasses("date_naissance")}
              />
            </div>
            {errors.date_naissance && (
              <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                <span className="w-1 h-1 bg-red-500 rounded-full" />
                {errors.date_naissance}
              </p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiAward className="w-3.5 h-3.5 text-blue-500" />
                Niveau
              </span>
            </label>
            <div className="relative">
              <select
                name="niveau"
                value={formData.niveau}
                onChange={handleChange}
                onFocus={() => handleFocus("niveau")}
                onBlur={handleBlur}
                className={inputClasses("niveau")}
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
                <FiCalendar className="w-3.5 h-3.5 text-blue-500" />
                Date d'adhésion *
              </span>
            </label>
            <div className="relative">
              <input
                type="date"
                name="date_adhesion"
                value={formData.date_adhesion}
                onChange={handleChange}
                onFocus={() => handleFocus("date_adhesion")}
                onBlur={handleBlur}
                className={inputClasses("date_adhesion")}
              />
            </div>
            {errors.date_adhesion && (
              <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                <span className="w-1 h-1 bg-red-500 rounded-full" />
                {errors.date_adhesion}
              </p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiMapPin className="w-3.5 h-3.5 text-blue-500" />
                Adresse
              </span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="adresse"
                value={formData.adresse}
                onChange={handleChange}
                onFocus={() => handleFocus("adresse")}
                onBlur={handleBlur}
                className={inputClasses("adresse")}
                placeholder="12 rue de la Plage"
              />
            </div>
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiMapPin className="w-3.5 h-3.5 text-blue-500" />
                Code postal
              </span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="code_postal"
                value={formData.code_postal}
                onChange={handleChange}
                onFocus={() => handleFocus("code_postal")}
                onBlur={handleBlur}
                className={inputClasses("code_postal")}
                placeholder="75000"
              />
            </div>
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiMapPin className="w-3.5 h-3.5 text-blue-500" />
                Ville
              </span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="ville"
                value={formData.ville}
                onChange={handleChange}
                onFocus={() => handleFocus("ville")}
                onBlur={handleBlur}
                className={inputClasses("ville")}
                placeholder="Paris"
              />
            </div>
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiBriefcase className="w-3.5 h-3.5 text-blue-500" />
                Profession
              </span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="profession"
                value={formData.profession}
                onChange={handleChange}
                onFocus={() => handleFocus("profession")}
                onBlur={handleBlur}
                className={inputClasses("profession")}
                placeholder="Ingénieur"
              />
            </div>
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiUsers className="w-3.5 h-3.5 text-blue-500" />
                Numéro de licence
              </span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="numero_licence"
                value={formData.numero_licence}
                onChange={handleChange}
                onFocus={() => handleFocus("numero_licence")}
                onBlur={handleBlur}
                className={inputClasses("numero_licence")}
                placeholder="LIC-2024-001"
              />
            </div>
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiHeart className="w-3.5 h-3.5 text-blue-500" />
                Situation familiale
              </span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="situation_familiale"
                value={formData.situation_familiale}
                onChange={handleChange}
                onFocus={() => handleFocus("situation_familiale")}
                onBlur={handleBlur}
                className={inputClasses("situation_familiale")}
                placeholder="Marié, 2 enfants"
              />
            </div>
          </motion.div>

          <motion.div {...fadeInUp} className="md:col-span-2">
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiFileText className="w-3.5 h-3.5 text-blue-500" />
                Remarques
              </span>
            </label>
            <div className="relative">
              <textarea
                name="remarques"
                value={formData.remarques}
                onChange={handleChange}
                onFocus={() => handleFocus("remarques")}
                onBlur={handleBlur}
                rows="3"
                className={inputClasses("remarques")}
                placeholder="Informations complémentaires..."
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
          onClick={() => navigate("/adherents")}
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
          {editMode ? "Mettre à jour" : "Créer l'adhérent"}
          <FiChevronRight className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.form>
  );
};

export default AdherentForm;
