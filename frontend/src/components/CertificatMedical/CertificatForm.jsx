import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
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
  FiUpload,
  FiFile,
} from "react-icons/fi";
import { useCertificats } from "../../hooks/CertificatMedical/useCertificats";
import { useAdherents } from "../../hooks/Adherent/useAdherents";
import LoadingSpinner from "../Common/LoadingSpinner";
import SearchableSelect from "../Common/SearchableSelect";

const CERTIFICAT_TYPES = ["Médical", "Sportif", "Plongée", "Révision"];
const CERTIFICAT_STATUS = ["Valide", "Expiré", "En attente"];

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
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
  const [documentFile, setDocumentFile] = useState(null);
  const [existingDocumentPath, setExistingDocumentPath] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);

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
      setExistingDocumentPath(cert.document_path || null);
    }
  }, [editMode, id, certificatData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setDocumentFile(file);
    setFilePreviewUrl((prevUrl) => {
      if (prevUrl) URL.revokeObjectURL(prevUrl);
      return file && file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : null;
    });
  };

  useEffect(() => {
    return () => {
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    };
  }, [filePreviewUrl]);

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
      let payload = formData;
      if (documentFile) {
        payload = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
          payload.append(key, value);
        });
        payload.append("document", documentFile);
      }
      if (editMode && id) {
        await update.mutateAsync({ id, data: payload });
      } else {
        await create.mutateAsync(payload);
      }
      navigate("/certificats");
    } catch (error) {
      console.error("Error:", error);
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
              {editMode ? "Modifier le certificat" : "Nouveau certificat"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {editMode
                ? "Mettez à jour les informations du certificat"
                : "Ajoutez un nouveau certificat médical"}
            </p>
          </div>
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
            <FiHeart className="w-6 h-6 text-blue-600 dark:text-blue-400" />
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
                <FiFileText className="w-4 h-4 text-gray-400" />
                Type *
              </span>
            </label>
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
            {errors.type_certificat && (
              <p className="mt-1.5 text-sm text-red-500">
                {errors.type_certificat}
              </p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiCalendar className="w-4 h-4 text-gray-400" />
                Date de validité *
              </span>
            </label>
            <input
              type="date"
              name="date_validite"
              value={formData.date_validite}
              onChange={handleChange}
              onFocus={() => handleFocus("date_validite")}
              onBlur={handleBlur}
              className={inputClasses("date_validite")}
            />
            {errors.date_validite && (
              <p className="mt-1.5 text-sm text-red-500">
                {errors.date_validite}
              </p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiClock className="w-4 h-4 text-gray-400" />
                Date de délivrance
              </span>
            </label>
            <input
              type="date"
              name="date_delivrance"
              value={formData.date_delivrance}
              onChange={handleChange}
              onFocus={() => handleFocus("date_delivrance")}
              onBlur={handleBlur}
              className={inputClasses("date_delivrance")}
            />
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiBriefcase className="w-4 h-4 text-gray-400" />
                Médecin *
              </span>
            </label>
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
            {errors.medecin && (
              <p className="mt-1.5 text-sm text-red-500">{errors.medecin}</p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiAward className="w-4 h-4 text-gray-400" />
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
              {CERTIFICAT_STATUS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </motion.div>

          <motion.div {...fadeInUp} className="md:col-span-2">
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiUpload className="w-4 h-4 text-gray-400" />
                Photo / scan du certificat (facultatif)
              </span>
            </label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              className={inputClasses("document")}
            />
            {documentFile ? (
              <div className="mt-1.5">
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <FiFile className="w-3.5 h-3.5" />
                  {documentFile.name}
                </p>
                {filePreviewUrl && (
                  <img
                    src={filePreviewUrl}
                    alt="Aperçu du document"
                    className="mt-2 max-h-48 rounded-lg border border-gray-200 dark:border-gray-600 object-contain"
                  />
                )}
              </div>
            ) : (
              existingDocumentPath && (
                <a
                  href={existingDocumentPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5"
                >
                  <FiFile className="w-3.5 h-3.5" />
                  Voir le document actuel
                </a>
              )
            )}
          </motion.div>
        </div>
      </div>

      {/* Pied de page */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-end gap-3">
        <button
          type="button"
          onClick={() => navigate("/certificats")}
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
          {editMode ? "Mettre à jour" : "Créer le certificat"}
        </button>
      </div>
    </motion.form>
  );
};

export default CertificatForm;
