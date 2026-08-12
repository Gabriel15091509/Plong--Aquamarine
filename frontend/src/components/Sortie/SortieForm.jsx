import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiCalendar,
  FiMapPin,
  FiMap,
  FiTag,
  FiAward,
  FiUsers,
  FiDroplet,
  FiClock,
  FiSave,
  FiX,
  FiFileText,
  FiClipboard,
  FiInfo,
  FiDollarSign,
  FiAlertTriangle,
} from "react-icons/fi";
import { useSorties } from "../../hooks/Sortie/useSorties";
import LoadingSpinner from "../Common/LoadingSpinner";
import SortieLocationPicker from "./SortieLocationPicker";
import {
  TYPE_SORTIE_OPTIONS,
  STATUT_SORTIE_OPTIONS,
  NIVEAU_OPTIONS,
} from "../../utils/constants";
import {
  formatDateForInput,
  formatDateTimeForInput,
} from "../../utils/helpers";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

// Jours de sortie habituels du club (voir page À propos "Infos
// pratiques") : dimanche(0), mercredi(3), samedi(6) — getDay(). Un autre
// jour reste possible (météo, sortie exceptionnelle...), donc un simple
// avertissement non bloquant plutôt qu'une erreur de validation.
const JOURS_SORTIE_HABITUELS = [0, 3, 6];

const isJourSortieInhabituel = (dateHeure) => {
  if (!dateHeure) return false;
  const jour = new Date(dateHeure).getDay();
  return !Number.isNaN(jour) && !JOURS_SORTIE_HABITUELS.includes(jour);
};

const SortieForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const editMode = !!id;

  const { useGetById, useCreate, useUpdate } = useSorties();
  const { data, isLoading: loadingData } = useGetById(id);
  const create = useCreate();
  const update = useUpdate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [focused, setFocused] = useState(null);

  const [formData, setFormData] = useState({
    date_heure: "",
    lieu: "",
    site: "",
    type: "Plongée d'exploration",
    niveau_requis: "Débutant",
    nb_places: 10,
    profondeur_max: 20,
    duree_estimee: "01:00",
    statut: "Planifiée",
    description_site: "",
    date_ouverture_inscriptions: "",
    condition_affectation: "",
    tarif_adherent: 0,
    tarif_non_adherent: "",
    latitude: "",
    longitude: "",
  });

  useEffect(() => {
    if (editMode && id && data?.data) {
      const s = data.data;
      setFormData({
        date_heure: formatDateTimeForInput(s.date_heure),
        lieu: s.lieu || "",
        site: s.site || "",
        type: s.type || "Plongée d'exploration",
        niveau_requis: s.niveau_requis || "Débutant",
        nb_places: s.nb_places || 10,
        profondeur_max: s.profondeur_max || 20,
        duree_estimee: s.duree_estimee || "01:00",
        statut: s.statut || "Planifiée",
        description_site: s.description_site || "",
        date_ouverture_inscriptions: formatDateForInput(
          s.date_ouverture_inscriptions,
        ),
        condition_affectation: s.condition_affectation || "",
        tarif_adherent: s.tarif_adherent ?? 0,
        tarif_non_adherent: s.tarif_non_adherent ?? "",
        latitude: s.latitude ?? "",
        longitude: s.longitude ?? "",
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

  const handleLocationChange = (lat, lng) =>
    setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }));

  const handleAddressResolved = ({ lieu, site }) =>
    setFormData((prev) => ({
      ...prev,
      lieu: lieu || prev.lieu,
      site: site || prev.site,
    }));

  const validate = () => {
    const newErrors = {};
    if (!formData.date_heure) newErrors.date_heure = "La date est requise";
    if (!formData.lieu) newErrors.lieu = "Le lieu est requis";
    if (!formData.site) newErrors.site = "Le site est requis";
    if (!formData.type) newErrors.type = "Le type est requis";
    if (!formData.nb_places || formData.nb_places < 1)
      newErrors.nb_places = "Minimum 1 place";
    if (!formData.profondeur_max || formData.profondeur_max < 0)
      newErrors.profondeur_max = "La profondeur est requise";
    if (!formData.date_ouverture_inscriptions)
      newErrors.date_ouverture_inscriptions = "La date d'ouverture est requise";
    if ((formData.latitude === "") !== (formData.longitude === ""))
      newErrors.latitude = "Cliquez sur la carte pour repositionner le site";
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
      navigate("/sorties");
    } catch (error) {
      console.error("Échec de l'enregistrement de la sortie :", error);
    } finally {
      setLoading(false);
    }
  };

  if (editMode && loadingData) return <LoadingSpinner variant="form" />;

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
              {editMode ? "Modifier la sortie" : "Nouvelle sortie"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {editMode
                ? "Mettez à jour les informations de la sortie"
                : "Planifiez une nouvelle sortie de plongée"}
            </p>
          </div>
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
            <FiMapPin className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </div>

      {/* Corps du formulaire */}
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiCalendar className="w-4 h-4 text-gray-400" />
                Date et heure *
              </span>
            </label>
            <input
              type="datetime-local"
              name="date_heure"
              value={formData.date_heure}
              onChange={handleChange}
              onFocus={() => handleFocus("date_heure")}
              onBlur={handleBlur}
              className={inputClasses("date_heure")}
            />
            {errors.date_heure && (
              <p className="mt-1.5 text-sm text-red-500">{errors.date_heure}</p>
            )}
            {!errors.date_heure && isJourSortieInhabituel(formData.date_heure) && (
              <p className="mt-1.5 text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <FiAlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                Les sorties ont habituellement lieu le mercredi, samedi ou
                dimanche.
              </p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiMapPin className="w-4 h-4 text-gray-400" />
                Lieu *
              </span>
            </label>
            <input
              type="text"
              name="lieu"
              value={formData.lieu}
              onChange={handleChange}
              onFocus={() => handleFocus("lieu")}
              onBlur={handleBlur}
              className={inputClasses("lieu")}
              placeholder="Port de Plaisance"
            />
            {errors.lieu && (
              <p className="mt-1.5 text-sm text-red-500">{errors.lieu}</p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiMap className="w-4 h-4 text-gray-400" />
                Site *
              </span>
            </label>
            <input
              type="text"
              name="site"
              value={formData.site}
              onChange={handleChange}
              onFocus={() => handleFocus("site")}
              onBlur={handleBlur}
              className={inputClasses("site")}
              placeholder="Île de Porquerolles"
            />
            {errors.site && (
              <p className="mt-1.5 text-sm text-red-500">{errors.site}</p>
            )}
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
              {TYPE_SORTIE_OPTIONS.map((opt) => (
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
                <FiAward className="w-4 h-4 text-gray-400" />
                Niveau requis
              </span>
            </label>
            <select
              name="niveau_requis"
              value={formData.niveau_requis}
              onChange={handleChange}
              onFocus={() => handleFocus("niveau_requis")}
              onBlur={handleBlur}
              className={inputClasses("niveau_requis")}
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
                <FiUsers className="w-4 h-4 text-gray-400" />
                Nombre de places *
              </span>
            </label>
            <input
              type="number"
              name="nb_places"
              value={formData.nb_places}
              onChange={handleChange}
              onFocus={() => handleFocus("nb_places")}
              onBlur={handleBlur}
              className={inputClasses("nb_places")}
              min="1"
            />
            {errors.nb_places && (
              <p className="mt-1.5 text-sm text-red-500">{errors.nb_places}</p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiDroplet className="w-4 h-4 text-gray-400" />
                Profondeur max (m) *
              </span>
            </label>
            <input
              type="number"
              name="profondeur_max"
              value={formData.profondeur_max}
              onChange={handleChange}
              onFocus={() => handleFocus("profondeur_max")}
              onBlur={handleBlur}
              className={inputClasses("profondeur_max")}
              min="0"
            />
            {errors.profondeur_max && (
              <p className="mt-1.5 text-sm text-red-500">
                {errors.profondeur_max}
              </p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiClock className="w-4 h-4 text-gray-400" />
                Durée estimée (HH:MM)
              </span>
            </label>
            <input
              type="time"
              name="duree_estimee"
              value={formData.duree_estimee}
              onChange={handleChange}
              onFocus={() => handleFocus("duree_estimee")}
              onBlur={handleBlur}
              className={inputClasses("duree_estimee")}
            />
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiDollarSign className="w-4 h-4 text-gray-400" />
                Tarif adhérent (€)
              </span>
            </label>
            <input
              type="number"
              step="0.01"
              name="tarif_adherent"
              value={formData.tarif_adherent}
              onChange={handleChange}
              onFocus={() => handleFocus("tarif_adherent")}
              onBlur={handleBlur}
              className={inputClasses("tarif_adherent")}
              placeholder="0.00"
              min="0"
            />
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              Montant dû par chaque adhérent inscrit à cette sortie (0 = gratuit).
            </p>
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiDollarSign className="w-4 h-4 text-gray-400" />
                Tarif non-adhérent (€)
              </span>
            </label>
            <input
              type="number"
              step="0.01"
              name="tarif_non_adherent"
              value={formData.tarif_non_adherent}
              onChange={handleChange}
              onFocus={() => handleFocus("tarif_non_adherent")}
              onBlur={handleBlur}
              className={inputClasses("tarif_non_adherent")}
              placeholder="Facultatif"
              min="0"
            />
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiCalendar className="w-4 h-4 text-gray-400" />
                Date ouverture inscriptions *
              </span>
            </label>
            <input
              type="date"
              name="date_ouverture_inscriptions"
              value={formData.date_ouverture_inscriptions}
              onChange={handleChange}
              onFocus={() => handleFocus("date_ouverture_inscriptions")}
              onBlur={handleBlur}
              className={inputClasses("date_ouverture_inscriptions")}
            />
            {errors.date_ouverture_inscriptions && (
              <p className="mt-1.5 text-sm text-red-500">
                {errors.date_ouverture_inscriptions}
              </p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiClipboard className="w-4 h-4 text-gray-400" />
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
              {STATUT_SORTIE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </motion.div>

          <motion.div {...fadeInUp} className="md:col-span-2">
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiFileText className="w-4 h-4 text-gray-400" />
                Description du site
              </span>
            </label>
            <textarea
              name="description_site"
              value={formData.description_site}
              onChange={handleChange}
              onFocus={() => handleFocus("description_site")}
              onBlur={handleBlur}
              rows="3"
              className={inputClasses("description_site")}
              placeholder="Décrivez le site de plongée..."
            />
          </motion.div>

          <motion.div {...fadeInUp} className="md:col-span-2">
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiInfo className="w-4 h-4 text-gray-400" />
                Conditions d'affectation
              </span>
            </label>
            <textarea
              name="condition_affectation"
              value={formData.condition_affectation}
              onChange={handleChange}
              onFocus={() => handleFocus("condition_affectation")}
              onBlur={handleBlur}
              rows="2"
              className={inputClasses("condition_affectation")}
              placeholder="Conditions spécifiques..."
            />
          </motion.div>

          <motion.div {...fadeInUp} className="md:col-span-2">
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiMap className="w-4 h-4 text-gray-400" />
                Localisation du site (cliquer sur la carte)
              </span>
            </label>
            <SortieLocationPicker
              latitude={formData.latitude}
              longitude={formData.longitude}
              onChange={handleLocationChange}
              onAddressResolved={handleAddressResolved}
            />
            {errors.latitude && (
              <p className="mt-1 text-xs text-red-500">{errors.latitude}</p>
            )}
          </motion.div>
        </div>
      </div>

      {/* Pied de page */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-end gap-3">
        <button
          type="button"
          onClick={() => navigate("/sorties")}
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
          {editMode ? "Mettre à jour" : "Créer la sortie"}
        </button>
      </div>
    </motion.form>
  );
};

export default SortieForm;
