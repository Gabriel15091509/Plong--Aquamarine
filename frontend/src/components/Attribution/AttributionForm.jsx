import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiSave,
  FiX,
  FiCalendar,
  FiTag,
} from "react-icons/fi";
import { useAttributions } from "../../hooks/Attribution/useAttributions";
import { useMateriels } from "../../hooks/Materiel/useMateriels";
import { useAdherents } from "../../hooks/Adherent/useAdherents";
import { useSorties } from "../../hooks/Sortie/useSorties";
import { useInscriptions } from "../../hooks/Inscription/useInscriptions";
import { useCloseFormModal } from "../../hooks/useFormModal";
import LoadingSpinner from "../Common/LoadingSpinner";
import SearchableSelect from "../Common/SearchableSelect";
import {
  ETAT_MATERIEL_OPTIONS,
  STATUTS_ADHERENT_EXCLUS_SELECTION,
} from "../../utils/constants";
import {
  formatDateForInput,
  isSortieSelectionnable,
  isMaterielDisponible,
} from "../../utils/helpers";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

const AttributionForm = () => {
  // Ferme la modale en revenant sur la page d'où elle a été ouverte (fiche
  // Matériel, fiche Sortie, ...) si elle vient de là, sinon sur la liste des
  // attributions — voir useCloseFormModal.
  const closeModal = useCloseFormModal("/attributions");
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const editMode = !!id;

  const { useGetById, useCreate, useUpdate } = useAttributions();
  const { useGetAll: useGetAllMateriels } = useMateriels();
  const { useGetAll: useGetAllAdherents } = useAdherents();
  const { useGetAll: useGetAllSorties } = useSorties();
  const { useGetConfirmationsBySortie } = useInscriptions();

  const { data: attributionData, isLoading: loadingData } = useGetById(id);
  const { data: materielsData, isLoading: loadingMateriels } =
    useGetAllMateriels();
  const { data: adherentsData, isLoading: loadingAdherents } =
    useGetAllAdherents();
  const { data: sortiesData, isLoading: loadingSorties } = useGetAllSorties();

  const create = useCreate();
  const update = useUpdate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    num_inventaire: searchParams.get("num_inventaire") || "",
    num_adherent: "",
    id_sortie: searchParams.get("id_sortie") || "",
    date_attribution: formatDateForInput(new Date()),
    etat_depart: "Bon",
    date_retour_prevue: "",
    piece_identite_retenue: "",
  });

  // Une sortie déjà en cours ou terminée ne doit plus être proposée, sauf si
  // c'est déjà la sortie liée à l'attribution en cours de modification.
  const sortiesSelectionnables = (sortiesData?.data || []).filter(
    (s) =>
      isSortieSelectionnable(s) ||
      String(s.id_sortie) === String(formData.id_sortie),
  );

  // Même principe : seul le matériel disponible (bon état, révision à jour,
  // physiquement au club) doit être proposé — sauf celui déjà lié à
  // l'attribution en cours de modification (par construction "Prêté" tant
  // qu'il n'est pas rendu, donc absent de la liste des disponibles).
  const materielsSelectionnables = (materielsData?.data || []).filter(
    (m) =>
      isMaterielDisponible(m) ||
      String(m.num_inventaire) === String(formData.num_inventaire),
  );

  // Attribuer du matériel "pour une sortie" n'a de sens que pour ses
  // participants (une attribution sans sortie liée — prêt libre — n'est
  // évidemment pas concernée). `enabled: !!id_sortie` dans le hook évite
  // l'appel tant qu'aucune sortie n'est choisie.
  const { data: confirmationsSortieData, isLoading: loadingConfirmationsSortie } =
    useGetConfirmationsBySortie(formData.id_sortie);
  const numAdherentsConfirmesSortie = formData.id_sortie
    ? new Set(
        (confirmationsSortieData?.data || []).map((inscription) =>
          String(inscription.num_adherent),
        ),
      )
    : null;

  // Un adhérent "Ancien"/"Suspendu" ne doit plus pouvoir être choisi pour un
  // NOUVEAU prêt de matériel (voir STATUTS_ADHERENT_EXCLUS_SELECTION), et si
  // une sortie est sélectionnée, seuls ses participants confirmés
  // (numAdherentsConfirmesSortie, calculé ci-dessus) sont proposés — sauf,
  // dans les deux cas, l'adhérent déjà lié à l'attribution en cours de
  // modification (ex. sortie changée après coup sur une attribution
  // existante : on ne fait pas disparaître la valeur déjà enregistrée).
  const adherentsSelectionnables = (adherentsData?.data || []).filter(
    (a) =>
      String(a.num_adherent) === String(formData.num_adherent) ||
      (!STATUTS_ADHERENT_EXCLUS_SELECTION.includes(a.statut) &&
        (!numAdherentsConfirmesSortie ||
          numAdherentsConfirmesSortie.has(String(a.num_adherent)))),
  );

  useEffect(() => {
    if (editMode && id && attributionData?.data) {
      const a = attributionData.data;
      setFormData({
        num_inventaire: a.num_inventaire || "",
        num_adherent: a.num_adherent || "",
        id_sortie: a.id_sortie || "",
        date_attribution: a.date_attribution
          ? a.date_attribution.split("T")[0]
          : "",
        etat_depart: a.etat_depart || "Bon",
        date_retour_prevue: a.date_retour_prevue
          ? a.date_retour_prevue.split("T")[0]
          : "",
        piece_identite_retenue: a.piece_identite_retenue || "",
      });
    }
  }, [editMode, id, attributionData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.num_inventaire)
      newErrors.num_inventaire = "Le matériel est requis";
    if (!formData.num_adherent)
      newErrors.num_adherent = "L'adhérent est requis";
    if (!formData.date_attribution)
      newErrors.date_attribution = "La date d'attribution est requise";
    if (!formData.date_retour_prevue)
      newErrors.date_retour_prevue = "La date de retour prévue est requise";
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
      console.error("Échec de l'enregistrement de l'attribution :", error);
    } finally {
      setLoading(false);
    }
  };

  if (
    (editMode && loadingData) ||
    loadingMateriels ||
    loadingAdherents ||
    loadingSorties
  )
    return <LoadingSpinner variant="form" />;

  const inputClasses = (fieldName) =>
    `w-full pl-4 pr-4 py-2.5 text-sm border rounded-lg focus:outline-none transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
      errors[fieldName]
        ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200"
        : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
    }`;

  const labelClasses =
    "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";

  return (
    <form onSubmit={handleSubmit}>
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <motion.div {...fadeInUp}>
            <SearchableSelect
              label="Matériel *"
              value={formData.num_inventaire}
              onChange={(value) => {
                setFormData((prev) => ({ ...prev, num_inventaire: value }));
                if (errors.num_inventaire)
                  setErrors((prev) => ({ ...prev, num_inventaire: "" }));
              }}
              options={materielsSelectionnables}
              getOptionLabel={(m) =>
                `${m.marque} ${m.modele} - N°${m.num_inventaire}`
              }
              getOptionValue={(m) => m.num_inventaire}
              placeholder="Rechercher un matériel..."
              error={errors.num_inventaire}
              required={true}
            />
          </motion.div>

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
              getOptionLabel={(a) => `${a.civilite} ${a.nom} ${a.prenom}`}
              getOptionValue={(a) => a.num_adherent}
              placeholder="Rechercher un adhérent..."
              error={errors.num_adherent}
              required={true}
            />
            {formData.id_sortie &&
              (loadingConfirmationsSortie ? (
                <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                  Chargement des participants de la sortie...
                </p>
              ) : numAdherentsConfirmesSortie.size === 0 ? (
                <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
                  Aucun participant confirmé pour cette sortie.
                </p>
              ) : (
                <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                  Seuls les participants confirmés de cette sortie sont
                  proposés.
                </p>
              ))}
          </motion.div>

          <motion.div {...fadeInUp}>
            <SearchableSelect
              label="Sortie"
              value={formData.id_sortie}
              onChange={(value) => {
                setFormData((prev) => ({ ...prev, id_sortie: value }));
              }}
              options={sortiesSelectionnables}
              getOptionLabel={(s) => `${s.type} - ${s.lieu}`}
              getOptionValue={(s) => s.id_sortie}
              placeholder="Rechercher une sortie..."
            />
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              Laisser vide pour un prêt libre entre deux sorties (durée
              limitée par la date de retour prévue, sans lien à une sortie
              précise).
            </p>
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiTag className="w-4 h-4 text-gray-400" />
                État au départ
              </span>
            </label>
            <select
              name="etat_depart"
              value={formData.etat_depart}
              onChange={handleChange}
              className={inputClasses("etat_depart")}
            >
              {ETAT_MATERIEL_OPTIONS.map((opt) => (
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
                Date d'attribution *
              </span>
            </label>
            <input
              type="date"
              name="date_attribution"
              value={formData.date_attribution}
              onChange={handleChange}
              className={inputClasses("date_attribution")}
            />
            {errors.date_attribution && (
              <p className="mt-1.5 text-sm text-red-500">
                {errors.date_attribution}
              </p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiCalendar className="w-4 h-4 text-gray-400" />
                Date de retour prévue *
              </span>
            </label>
            <input
              type="date"
              name="date_retour_prevue"
              value={formData.date_retour_prevue}
              onChange={handleChange}
              className={inputClasses("date_retour_prevue")}
            />
            {errors.date_retour_prevue && (
              <p className="mt-1.5 text-sm text-red-500">
                {errors.date_retour_prevue}
              </p>
            )}
          </motion.div>

          <motion.div {...fadeInUp} className="md:col-span-2">
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiTag className="w-4 h-4 text-gray-400" />
                Pièce d'identité retenue
              </span>
            </label>
            <input
              type="text"
              name="piece_identite_retenue"
              value={formData.piece_identite_retenue}
              onChange={handleChange}
              className={inputClasses("piece_identite_retenue")}
              placeholder="Ex : CNI n° 123456789 (alternative à la caution)"
            />
          </motion.div>
        </div>
      </div>

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
          {editMode ? "Mettre à jour" : "Créer l'attribution"}
        </button>
      </div>
    </form>
  );
};

export default AttributionForm;
