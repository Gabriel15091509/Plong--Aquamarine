import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  FiUser,
  FiCalendar,
  FiTag,
  FiList,
  FiCheckCircle,
  FiClock,
  FiSave,
  FiX,
  FiChevronRight,
  FiUsers,
  FiInfo,
} from "react-icons/fi";
import { useInscriptions } from "../../hooks/useInscriptions";
import { useAdherents } from "../../hooks/useAdherents";
import { useSorties } from "../../hooks/useSorties";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../Common/LoadingSpinner";
import SearchableSelect from "../Common/SearchableSelect";

const INSCRIPTION_STATUS = [
  "En attente",
  "Confirmée",
  "Annulée",
  "Liste d'attente",
];

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

const InscriptionForm = ({ editMode = false, inscriptionId = null }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { useGetById, useCreate, useUpdate } = useInscriptions();
  const { useGetAll: useGetAllAdherents } = useAdherents();
  const { useGetAll: useGetAllSorties } = useSorties();

  const { data: inscriptionData, isLoading: loadingData } =
    useGetById(inscriptionId);
  const { data: adherentsData, isLoading: loadingAdherents } =
    useGetAllAdherents();
  const { data: sortiesData, isLoading: loadingSorties } = useGetAllSorties();

  const create = useCreate();
  const update = useUpdate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [focused, setFocused] = useState(null);

  const canManageInscriptions = [
    "president",
    "directeur_technique",
    "moniteur",
    "tresorier",
    "admin",
  ].includes(user?.role);
  const isAdherent = !canManageInscriptions;

  const currentAdherent = useMemo(() => {
    if (!adherentsData?.data || !user) return null;
    return adherentsData.data.find((adherent) => adherent.email === user.email);
  }, [adherentsData, user]);

  const [formData, setFormData] = useState({
    num_adherent: "",
    id_sortie: "",
    statut: "En attente",
    rang_liste_attente: "",
    presence: false,
    date_confirmation: "",
  });

  useEffect(() => {
    if (isAdherent && currentAdherent) {
      setFormData((prev) => ({
        ...prev,
        num_adherent: currentAdherent.num_adherent,
      }));
    }
  }, [isAdherent, currentAdherent]);

  useEffect(() => {
    if (editMode && inscriptionId && inscriptionData?.data) {
      const i = inscriptionData.data;
      setFormData({
        num_adherent: i.num_adherent || "",
        id_sortie: i.id_sortie || "",
        statut: i.statut || "En attente",
        rang_liste_attente: i.rang_liste_attente || "",
        presence: i.presence || false,
        date_confirmation: i.date_confirmation
          ? i.date_confirmation.split("T")[0]
          : "",
      });
    }
  }, [editMode, inscriptionId, inscriptionData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "statut" && isAdherent) {
      return;
    }

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
    if (!formData.id_sortie) newErrors.id_sortie = "La sortie est requise";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      const dataToSubmit = {
        num_adherent: parseInt(formData.num_adherent),
        id_sortie: parseInt(formData.id_sortie),
        statut: isAdherent ? "En attente" : formData.statut,
        rang_liste_attente: formData.rang_liste_attente
          ? parseInt(formData.rang_liste_attente)
          : null,
        presence: formData.presence || false,
        date_confirmation: formData.date_confirmation || null,
        role: user?.role,
      };

      if (editMode && inscriptionId) {
        await update.mutateAsync({ id: inscriptionId, data: dataToSubmit });
        toast.success("Inscription modifiée avec succès");
      } else {
        await create.mutateAsync(dataToSubmit);
        toast.success("Inscription créée avec succès");
      }
      navigate("/inscriptions");
    } catch (error) {
      console.error("❌ Erreur complète:", error);
      toast.error(
        error.response?.data?.message || "Erreur lors de l'enregistrement",
      );
    } finally {
      setLoading(false);
    }
  };

  if (editMode && loadingData) return <LoadingSpinner />;
  if (loadingAdherents || loadingSorties) return <LoadingSpinner />;

  const availableStatus = isAdherent ? ["En attente"] : INSCRIPTION_STATUS;

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
              {editMode ? "Modifier l'inscription" : "Nouvelle inscription"}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-sm text-cyan-100/80 mt-0.5 font-light"
            >
              {editMode
                ? "Mettez à jour les informations d'inscription"
                : "Inscrivez un adhérent à une sortie"}
            </motion.p>
          </div>
          <motion.div
            variants={floatIcon}
            initial="initial"
            animate="animate"
            className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 shadow-xl"
          >
            <FiUsers className="w-7 h-7 text-white" />
          </motion.div>
        </div>
      </div>

      <div className="p-7 space-y-7">
        {isAdherent && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-xl p-4"
          >
            <div className="flex items-start gap-3">
              <FiInfo className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  Vous êtes connecté en tant qu'adhérent
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Votre inscription sera automatiquement mise en attente. Un
                  moniteur ou le président devra la confirmer.
                </p>
              </div>
            </div>
          </motion.div>
        )}

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
              disabled={isAdherent}
              required={true}
            />
          </motion.div>

          <motion.div {...fadeInUp}>
            <SearchableSelect
              label="Sortie *"
              value={formData.id_sortie}
              onChange={(value) => {
                setFormData((prev) => ({ ...prev, id_sortie: value }));
                if (errors.id_sortie)
                  setErrors((prev) => ({ ...prev, id_sortie: "" }));
              }}
              options={sortiesData?.data || []}
              getOptionLabel={(s) => `${s.type} - ${s.lieu} (${s.site})`}
              getOptionValue={(s) => s.id_sortie}
              placeholder="Rechercher une sortie..."
              error={errors.id_sortie}
              required={true}
            />
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiClock className="w-3.5 h-3.5 text-blue-500" />
                Statut
              </span>
            </label>
            <div className="relative">
              <select
                name="statut"
                value={formData.statut}
                onChange={handleChange}
                disabled={isAdherent}
                onFocus={() => handleFocus("statut")}
                onBlur={handleBlur}
                className={inputClasses("statut")}
              >
                {availableStatus.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            {isAdherent && (
              <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                ⏳ Statut bloqué sur "En attente" pour les adhérents
              </p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiList className="w-3.5 h-3.5 text-blue-500" />
                Rang liste d'attente
              </span>
            </label>
            <div className="relative">
              <input
                type="number"
                name="rang_liste_attente"
                value={formData.rang_liste_attente}
                onChange={handleChange}
                disabled={isAdherent}
                onFocus={() => handleFocus("rang_liste_attente")}
                onBlur={handleBlur}
                className={inputClasses("rang_liste_attente")}
                min="0"
                placeholder="0"
              />
            </div>
            {isAdherent && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Le rang sera déterminé automatiquement
              </p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiCheckCircle className="w-3.5 h-3.5 text-blue-500" />
                Date confirmation
              </span>
            </label>
            <div className="relative">
              <input
                type="date"
                name="date_confirmation"
                value={formData.date_confirmation}
                onChange={handleChange}
                disabled={isAdherent}
                onFocus={() => handleFocus("date_confirmation")}
                onBlur={handleBlur}
                className={inputClasses("date_confirmation")}
              />
            </div>
            {isAdherent && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Sera définie lors de la confirmation
              </p>
            )}
          </motion.div>

          <motion.div {...fadeInUp} className="flex items-center pt-6">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  name="presence"
                  checked={formData.presence}
                  onChange={handleChange}
                  disabled={isAdherent}
                  className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                Présent
              </span>
            </label>
            {isAdherent && (
              <span className="ml-3 text-xs text-gray-400 dark:text-gray-500">
                (Géré par le moniteur)
              </span>
            )}
          </motion.div>
        </div>
      </div>

      <div className="px-7 py-5 bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-800/50 dark:to-gray-900/50 border-t border-gray-100/80 dark:border-gray-800/80 flex flex-col sm:flex-row justify-end gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={() => navigate("/inscriptions")}
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
          {editMode ? "Mettre à jour" : "Créer l'inscription"}
          <FiChevronRight className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.form>
  );
};

export default InscriptionForm;
