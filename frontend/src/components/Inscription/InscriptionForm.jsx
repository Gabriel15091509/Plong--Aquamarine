import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  FiClock,
  FiSave,
  FiX,
  FiUsers,
  FiInfo,
  FiMapPin,
} from "react-icons/fi";
import { useInscriptions } from "../../hooks/Inscription/useInscriptions";
import { useAdherents } from "../../hooks/Adherent/useAdherents";
import { useSorties } from "../../hooks/Sortie/useSorties";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../Common/LoadingSpinner";
import SearchableSelect from "../Common/SearchableSelect";
import { isSortieSelectionnable, isNiveauCompatible } from "../../utils/helpers";

const INSCRIPTION_STATUS = [
  "En attente",
  "Confirmée",
  "Annulée",
  "Liste d'attente",
];

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

const InscriptionForm = ({ editMode = false, inscriptionId = null }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sortieIdParam = searchParams.get("sortie"); // Récupérer l'ID de la sortie depuis l'URL

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

  const canManageInscriptions = ["president", "moniteur", "tresorier"].includes(
    user?.role,
  );
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

  // Pré-sélectionner la sortie si l'ID est passé en paramètre
  useEffect(() => {
    if (sortieIdParam && !editMode) {
      setFormData((prev) => ({
        ...prev,
        id_sortie: parseInt(sortieIdParam),
      }));
    }
  }, [sortieIdParam, editMode]);

  // Récupérer les informations de la sortie sélectionnée
  const selectedSortie = useMemo(() => {
    if (!formData.id_sortie || !sortiesData?.data) return null;
    return sortiesData.data.find(
      (s) => (s.id_sortie || s.id) === parseInt(formData.id_sortie),
    );
  }, [formData.id_sortie, sortiesData]);

  // Adhérent concerné par le filtre de niveau ci-dessous : soi-même pour un
  // adhérent qui s'inscrit, ou celui actuellement choisi dans le select
  // "Adhérent" quand c'est le président/moniteur qui inscrit quelqu'un —
  // dans ce second cas c'est bien le niveau de la PERSONNE INSCRITE qui
  // compte, jamais celui du gestionnaire qui remplit le formulaire.
  const adherentConcerne = useMemo(() => {
    if (isAdherent) return currentAdherent;
    if (!formData.num_adherent || !adherentsData?.data) return null;
    return adherentsData.data.find(
      (a) => a.num_adherent === formData.num_adherent,
    );
  }, [isAdherent, currentAdherent, formData.num_adherent, adherentsData]);

  // Une sortie déjà en cours ou terminée ne doit plus être proposée, sauf si
  // c'est déjà la sortie liée à l'inscription en cours de modification. Le
  // niveau requis doit aussi être compatible avec l'adhérent concerné (voir
  // adherentConcerne ci-dessus) — pas de filtre tant qu'aucun adhérent n'est
  // encore choisi (le président/moniteur peut sélectionner la sortie avant
  // l'adhérent, l'ordre des champs n'est pas imposé).
  const sortiesSelectionnables = useMemo(
    () =>
      (sortiesData?.data || []).filter(
        (s) =>
          (isSortieSelectionnable(s) ||
            String(s.id_sortie) === String(formData.id_sortie)) &&
          (!adherentConcerne ||
            isNiveauCompatible(adherentConcerne.niveau, s.niveau_requis)),
      ),
    [sortiesData, formData.id_sortie, adherentConcerne],
  );

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
        rang_liste_attente: i.rang_liste_attente ?? "",
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
        num_adherent: formData.num_adherent,
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
      console.error("Échec de l'enregistrement de l'inscription :", error);
      toast.error(
        error.response?.data?.message || "Erreur lors de l'enregistrement",
      );
    } finally {
      setLoading(false);
    }
  };

  if (editMode && loadingData) return <LoadingSpinner variant="form" />;
  if (loadingAdherents || loadingSorties)
    return <LoadingSpinner variant="form" />;

  const availableStatus = isAdherent ? ["En attente"] : INSCRIPTION_STATUS;

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
              {editMode ? "Modifier l'inscription" : "Nouvelle inscription"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {editMode
                ? "Mettez à jour les informations d'inscription"
                : "Inscrivez un adhérent à une sortie"}
            </p>
            {sortieIdParam && selectedSortie && !editMode && (
              <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-1">
                <FiMapPin className="inline mr-1 w-3.5 h-3.5" />
                Sortie pré-sélectionnée : {selectedSortie.type} -{" "}
                {selectedSortie.lieu}
              </p>
            )}
          </div>
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
            <FiUsers className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </div>

      {/* Corps du formulaire */}
      <div className="p-6 space-y-6">
        {isAdherent && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-lg p-4"
          >
            <div className="flex items-start gap-3">
              <FiInfo className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  Vous êtes connecté en tant qu&apos;adhérent
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
              options={sortiesSelectionnables}
              getOptionLabel={(s) => {
                const date = new Date(s.date_heure);
                return `${s.type} - ${s.lieu} (${date.toLocaleDateString("fr-FR")})`;
              }}
              getOptionValue={(s) => s.id_sortie}
              placeholder="Rechercher une sortie..."
              error={errors.id_sortie}
              required={true}
            />
            {sortieIdParam && selectedSortie && !editMode && (
              <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                Sortie pré-sélectionnée : {selectedSortie.type} -{" "}
                {selectedSortie.lieu}
              </p>
            )}
            {adherentConcerne && (
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                {sortiesSelectionnables.length === 0
                  ? `Aucune sortie ouverte ne correspond à ${
                      isAdherent ? "votre niveau" : "son niveau"
                    } (${adherentConcerne.niveau || "niveau inconnu"}).`
                  : `Filtré selon ${
                      isAdherent ? "votre niveau" : "son niveau"
                    } (${adherentConcerne.niveau || "niveau inconnu"}).`}
              </p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiClock className="w-4 h-4 text-gray-400" />
                Statut
              </span>
            </label>
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
            {isAdherent && (
              <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                ⏳ Statut bloqué sur &quot;En attente&quot; pour les adhérents
              </p>
            )}
          </motion.div>

        </div>

      </div>

      {/* Pied de page */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-end gap-3">
        <button
          type="button"
          onClick={() => navigate("/inscriptions")}
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
          {editMode ? "Mettre à jour" : "Créer l'inscription"}
        </button>
      </div>
    </motion.form>
  );
};

export default InscriptionForm;
