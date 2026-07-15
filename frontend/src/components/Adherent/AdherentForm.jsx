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
  FiUserPlus,
  FiBriefcase,
  FiHeart,
} from "react-icons/fi";
import { useAdherents } from "../../hooks/Adherent/useAdherents";
import LoadingSpinner from "../Common/LoadingSpinner";
import { sendWelcomeEmailIfNeeded } from "../../utils/welcomeEmail";

const CIVILITE_OPTIONS = ["M.", "Mme", "Mlle"];
const NIVEAU_OPTIONS = [
  "Débutant",
  "Niveau 1",
  "Niveau 2",
  "Niveau 3",
  "Niveau 4",
  "Moniteur",
];

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
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
      } else {
        const result = await create.mutateAsync(formData);
        await sendWelcomeEmailIfNeeded(result);
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
              {editMode ? "Modifier l'adhérent" : "Nouvel adhérent"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {editMode
                ? "Mettez à jour les informations de l'adhérent"
                : "Ajoutez un nouveau membre au club"}
            </p>
          </div>
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
            <FiUserPlus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </div>

      {/* Corps du formulaire */}
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiUser className="w-4 h-4 text-gray-400" />
                Civilité
              </span>
            </label>
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
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiUser className="w-4 h-4 text-gray-400" />
                Nom *
              </span>
            </label>
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
            {errors.nom && (
              <p className="mt-1.5 text-sm text-red-500">{errors.nom}</p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiUser className="w-4 h-4 text-gray-400" />
                Prénom *
              </span>
            </label>
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
            {errors.prenom && (
              <p className="mt-1.5 text-sm text-red-500">{errors.prenom}</p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
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
              placeholder="jean.dupont@email.com"
            />
            {errors.email && (
              <p className="mt-1.5 text-sm text-red-500">{errors.email}</p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiPhone className="w-4 h-4 text-gray-400" />
                Téléphone *
              </span>
            </label>
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
            {errors.telephone && (
              <p className="mt-1.5 text-sm text-red-500">{errors.telephone}</p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiCalendar className="w-4 h-4 text-gray-400" />
                Date de naissance *
              </span>
            </label>
            <input
              type="date"
              name="date_naissance"
              value={formData.date_naissance}
              onChange={handleChange}
              onFocus={() => handleFocus("date_naissance")}
              onBlur={handleBlur}
              className={inputClasses("date_naissance")}
            />
            {errors.date_naissance && (
              <p className="mt-1.5 text-sm text-red-500">
                {errors.date_naissance}
              </p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiAward className="w-4 h-4 text-gray-400" />
                Niveau
              </span>
            </label>
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
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiCalendar className="w-4 h-4 text-gray-400" />
                Date d'adhésion *
              </span>
            </label>
            <input
              type="date"
              name="date_adhesion"
              value={formData.date_adhesion}
              onChange={handleChange}
              onFocus={() => handleFocus("date_adhesion")}
              onBlur={handleBlur}
              className={inputClasses("date_adhesion")}
            />
            {errors.date_adhesion && (
              <p className="mt-1.5 text-sm text-red-500">
                {errors.date_adhesion}
              </p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiMapPin className="w-4 h-4 text-gray-400" />
                Adresse
              </span>
            </label>
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
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiMapPin className="w-4 h-4 text-gray-400" />
                Code postal
              </span>
            </label>
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
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiMapPin className="w-4 h-4 text-gray-400" />
                Ville
              </span>
            </label>
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
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiBriefcase className="w-4 h-4 text-gray-400" />
                Profession
              </span>
            </label>
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
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiUsers className="w-4 h-4 text-gray-400" />
                Numéro de licence
              </span>
            </label>
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
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiHeart className="w-4 h-4 text-gray-400" />
                Situation familiale
              </span>
            </label>
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
          </motion.div>

          <motion.div {...fadeInUp} className="md:col-span-2">
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiFileText className="w-4 h-4 text-gray-400" />
                Remarques
              </span>
            </label>
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
          </motion.div>
        </div>
      </div>

      {/* Pied de page */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-end gap-3">
        <button
          type="button"
          onClick={() => navigate("/adherents")}
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
          {editMode ? "Mettre à jour" : "Créer l'adhérent"}
        </button>
      </div>
    </motion.form>
  );
};

export default AdherentForm;
