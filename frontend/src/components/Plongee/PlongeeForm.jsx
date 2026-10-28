import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiUser,
  FiCalendar,
  FiDroplet,
  FiClock,
  FiThermometer,
  FiEye,
  FiTag,
  FiFileText,
  FiCheckCircle,
  FiSave,
  FiX,
  FiActivity,
} from "react-icons/fi";
import { usePlongees } from "../../hooks/Plongee/usePlongees";
import { useCloseFormModal } from "../../hooks/useFormModal";
import { useAdherents } from "../../hooks/Adherent/useAdherents";
import { useSeances } from "../../hooks/Formation/useSeances";
import { useSorties } from "../../hooks/Sortie/useSorties";
import { useInscriptions } from "../../hooks/Inscription/useInscriptions";
import LoadingSpinner from "../Common/LoadingSpinner";
import SearchableSelect from "../Common/SearchableSelect";
import {
  TYPE_PLONGEE_OPTIONS,
  VISIBILITE_OPTIONS,
  COURANT_OPTIONS,
  STATUT_SORTIE,
} from "../../utils/constants";
import { formatDate, formatDateTime } from "../../utils/helpers";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

const PlongeeForm = () => {
  // Ferme la modale en revenant sur la page d'où elle a été ouverte si elle
  // vient de là, sinon sur la liste des plongées — voir useCloseFormModal.
  const closeModal = useCloseFormModal("/plongees");
  const { id } = useParams();
  const editMode = !!id;

  const { useGetById, useCreate, useUpdate } = usePlongees();
  const { useGetAll } = useAdherents();
  const { useGetPlanifieesByAdherent } = useSeances();
  const { useGetAll: useGetAllSorties } = useSorties();
  const { useGetConfirmationsBySortie } = useInscriptions();

  const { data, isLoading: loadingData } = useGetById(id);
  const { data: adherentsData, isLoading: loadingAdherents } = useGetAll();
  const { data: sortiesData, isLoading: loadingSorties } = useGetAllSorties();

  const create = useCreate();
  const update = useUpdate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [focused, setFocused] = useState(null);

  const [formData, setFormData] = useState({
    num_adherent: "",
    id_sortie: "",
    date: "",
    profondeur_max: "",
    duree: "",
    temperature_eau: "",
    visibilite: "Bonne",
    courant: "Nul",
    type_plongee: "Plongée d'exploration",
    observations_faune: "",
    id_seance: "",
  });

  const { data: seancesPlanifieesData } = useGetPlanifieesByAdherent(
    formData.type_plongee === "Formation" ? formData.num_adherent : null,
  );

  // Une plongée documente un plongeon déjà réalisé et complet (profondeur
  // max atteinte, durée totale...) : contrairement à IncidentForm (qui
  // partage isSortieUtilisablePourConstat et accepte "En cours"), une
  // sortie encore "En cours" n'a pas fini de se dérouler — ses valeurs
  // finales ne sont pas encore connues. Seule "Terminée" est donc proposée
  // ici. Le type de plongée (choisi juste au-dessus, voir son bloc)
  // restreint encore la liste : pas la peine de faire défiler des sorties
  // "Baptême" quand on documente une "Plongée technique". La sortie déjà
  // sélectionnée reste visible même si son statut/type ne correspond plus
  // (ex. en modification), sinon le champ afficherait une valeur sans
  // option correspondante.
  const sortiesSelectionnables = (sortiesData?.data || []).filter(
    (s) =>
      (s.statut === STATUT_SORTIE.TERMINEE || String(s.id_sortie) === String(formData.id_sortie)) &&
      (!formData.type_plongee || s.type === formData.type_plongee || String(s.id_sortie) === String(formData.id_sortie)),
  );

  // Une plongée documente ce qu'un participant de LA sortie a vécu : pas la
  // peine de faire chercher tout le club dans le select Adhérent une fois
  // la sortie connue, seuls ses inscrits confirmés sont concernés. Même
  // motif que AttributionForm.jsx. `enabled: !!id_sortie` dans le hook
  // évite l'appel tant qu'aucune sortie n'est choisie (liste non filtrée à
  // ce stade). L'adhérent déjà choisi reste toujours proposé, y compris si
  // la sortie change ensuite et ne le compte plus parmi ses confirmés — on
  // ne fait pas disparaître une valeur déjà saisie.
  const { data: confirmationsSortieData } = useGetConfirmationsBySortie(
    formData.id_sortie,
  );
  const numAdherentsConfirmesSortie = formData.id_sortie
    ? new Set(
        (confirmationsSortieData?.data || []).map((inscription) =>
          String(inscription.num_adherent),
        ),
      )
    : null;
  const adherentsSelectionnables = (adherentsData?.data || []).filter(
    (a) =>
      String(a.num_adherent) === String(formData.num_adherent) ||
      !numAdherentsConfirmesSortie ||
      numAdherentsConfirmesSortie.has(String(a.num_adherent)),
  );

  useEffect(() => {
    if (editMode && id && data?.data) {
      const p = data.data;
      setFormData({
        num_adherent: p.num_adherent || "",
        id_sortie: p.id_sortie || "",
        date: p.date ? p.date.split("T")[0] : "",
        profondeur_max: p.profondeur_max ?? "",
        duree: p.duree ?? "",
        temperature_eau: p.temperature_eau ?? "",
        visibilite: p.visibilite || "Bonne",
        courant: p.courant || "Nul",
        type_plongee: p.type_plongee || "Plongée d'exploration",
        observations_faune: p.observations_faune || "",
        id_seance: p.id_seance || "",
      });
    }
  }, [editMode, id, data]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
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
    if (!formData.date) newErrors.date = "La date est requise";
    if (!formData.profondeur_max || formData.profondeur_max <= 0)
      newErrors.profondeur_max = "La profondeur est requise";
    if (!formData.duree || formData.duree <= 0)
      newErrors.duree = "La durée est requise";
    if (!formData.type_plongee) newErrors.type_plongee = "Le type est requis";
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
      closeModal();
    } catch (error) {
      console.error("Échec de l'enregistrement de la plongée :", error);
    } finally {
      setLoading(false);
    }
  };

  if (editMode && loadingData) return <LoadingSpinner variant="form" />;
  if (loadingAdherents) return <LoadingSpinner variant="form" />;

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
    <form onSubmit={handleSubmit}>
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
              options={adherentsSelectionnables}
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
                Type de plongée *
              </span>
            </label>
            <select
              name="type_plongee"
              value={formData.type_plongee}
              onChange={(e) => {
                const { value } = e.target;
                setFormData((prev) => {
                  const sortieActuelle = (sortiesData?.data || []).find(
                    (s) => String(s.id_sortie) === String(prev.id_sortie),
                  );
                  // La sortie déjà choisie ne correspond plus au type
                  // sélectionné : elle sort de la liste filtrée ci-dessous,
                  // on vide donc la sélection plutôt que de garder une
                  // valeur devenue invisible dans le select.
                  const sortieEncoreValide =
                    !sortieActuelle || sortieActuelle.type === value;
                  return {
                    ...prev,
                    type_plongee: value,
                    id_sortie: sortieEncoreValide ? prev.id_sortie : "",
                    id_seance: value === "Formation" ? prev.id_seance : "",
                  };
                });
                if (errors.type_plongee)
                  setErrors((prev) => ({ ...prev, type_plongee: "" }));
              }}
              onFocus={() => handleFocus("type_plongee")}
              onBlur={handleBlur}
              className={inputClasses("type_plongee")}
            >
              {TYPE_PLONGEE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            {errors.type_plongee && (
              <p className="mt-1.5 text-sm text-red-500">
                {errors.type_plongee}
              </p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <SearchableSelect
              label="Sortie *"
              value={formData.id_sortie}
              onChange={(value) => {
                const sortie = (sortiesData?.data || []).find(
                  (s) => String(s.id_sortie) === String(value),
                );
                setFormData((prev) => ({
                  ...prev,
                  id_sortie: value,
                  type_plongee: sortie?.type || prev.type_plongee,
                  id_seance:
                    sortie?.type === "Formation" ? prev.id_seance : "",
                }));
                if (errors.id_sortie)
                  setErrors((prev) => ({ ...prev, id_sortie: "" }));
              }}
              options={sortiesSelectionnables}
              getOptionLabel={(s) =>
                `${s.type} — ${s.site} — ${formatDateTime(s.date_heure)}`
              }
              getOptionValue={(s) => s.id_sortie}
              placeholder={
                loadingSorties
                  ? "Chargement des sorties..."
                  : "Rechercher une sortie..."
              }
              error={errors.id_sortie}
              required={true}
            />
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiCalendar className="w-4 h-4 text-gray-400" />
                Date *
              </span>
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              onFocus={() => handleFocus("date")}
              onBlur={handleBlur}
              className={inputClasses("date")}
            />
            {errors.date && (
              <p className="mt-1.5 text-sm text-red-500">{errors.date}</p>
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
              placeholder="0"
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
                Durée (minutes) *
              </span>
            </label>
            <input
              type="number"
              name="duree"
              value={formData.duree}
              onChange={handleChange}
              onFocus={() => handleFocus("duree")}
              onBlur={handleBlur}
              className={inputClasses("duree")}
              min="0"
              placeholder="0"
            />
            {errors.duree && (
              <p className="mt-1.5 text-sm text-red-500">{errors.duree}</p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiThermometer className="w-4 h-4 text-gray-400" />
                Température de l'eau (°C)
              </span>
            </label>
            <input
              type="number"
              step="0.1"
              name="temperature_eau"
              value={formData.temperature_eau}
              onChange={handleChange}
              onFocus={() => handleFocus("temperature_eau")}
              onBlur={handleBlur}
              className={inputClasses("temperature_eau")}
              placeholder="0.0"
            />
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiEye className="w-4 h-4 text-gray-400" />
                Visibilité
              </span>
            </label>
            <select
              name="visibilite"
              value={formData.visibilite}
              onChange={handleChange}
              onFocus={() => handleFocus("visibilite")}
              onBlur={handleBlur}
              className={inputClasses("visibilite")}
            >
              {VISIBILITE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiActivity className="w-4 h-4 text-gray-400" />
                Courant
              </span>
            </label>
            <select
              name="courant"
              value={formData.courant}
              onChange={handleChange}
              onFocus={() => handleFocus("courant")}
              onBlur={handleBlur}
              className={inputClasses("courant")}
            >
              {COURANT_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </motion.div>

          {formData.type_plongee === "Formation" && (
            <motion.div {...fadeInUp}>
              <SearchableSelect
                label="Séance de formation liée (optionnel)"
                value={formData.id_seance}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, id_seance: value }))
                }
                options={seancesPlanifieesData?.data || []}
                getOptionLabel={(s) =>
                  `${s.formation?.niveau_vise || "Formation"} — ${formatDate(s.date_seance)}`
                }
                getOptionValue={(s) => s.id_seance}
                placeholder={
                  formData.num_adherent
                    ? "Rechercher une séance planifiée..."
                    : "Sélectionnez d'abord un adhérent"
                }
                disabled={!formData.num_adherent}
              />
              <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                Si cette plongée valide une séance pratique planifiée, la séance
                sera marquée &quot;Réalisée&quot; lors de la validation de la plongée.
              </p>
            </motion.div>
          )}

          <motion.div {...fadeInUp} className="md:col-span-2">
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiFileText className="w-4 h-4 text-gray-400" />
                Observations
              </span>
            </label>
            <textarea
              name="observations_faune"
              value={formData.observations_faune}
              onChange={handleChange}
              onFocus={() => handleFocus("observations_faune")}
              onBlur={handleBlur}
              rows="3"
              className={inputClasses("observations_faune")}
              placeholder="Observations de la faune..."
            />
          </motion.div>

        </div>
      </div>

      {/* Pied de page */}
      <div className="sticky bottom-0 px-6 py-4 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-end gap-3">
        <button
          type="button"
          onClick={closeModal}
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
          {editMode ? "Mettre à jour" : "Créer la plongée"}
        </button>
      </div>
    </form>
  );
};

export default PlongeeForm;
