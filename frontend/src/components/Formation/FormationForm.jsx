import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiUser,
  FiAward,
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiList,
  FiFileText,
  FiSave,
  FiX,
  FiBookOpen,
  FiDollarSign,
  FiCreditCard,
} from "react-icons/fi";
import { useFormations } from "../../hooks/Formation/useFormations";
import { useAdherents } from "../../hooks/Adherent/useAdherents";
import LoadingSpinner from "../Common/LoadingSpinner";
import SearchableSelect from "../Common/SearchableSelect";
import {
  NIVEAU_FORMATION_OPTIONS,
  STATUT_FORMATION_OPTIONS,
  MODE_PAIEMENT_OPTIONS,
} from "../../utils/constants";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

const FormationForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const editMode = !!id;

  const { useGetById, useCreate, useUpdate } = useFormations();
  const { useGetAll } = useAdherents();

  const { data, isLoading: loadingData } = useGetById(id);
  const { data: adherentsData, isLoading: loadingAdherents } = useGetAll();

  const create = useCreate();
  const update = useUpdate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [focused, setFocused] = useState(null);
  const submittingRef = useRef(false);

  const [formData, setFormData] = useState({
    num_adherent: "",
    niveau_vise: "N1",
    date_debut: "",
    date_fin_prevue: "",
    date_examen_brevet: "",
    statut: "En cours",
    nb_seances_realisees: 0,
    commentaire_moniteur: "",
    montant_total: "",
    montant_paye: "",
    mode: "Espèces",
  });

  useEffect(() => {
    if (editMode && id && data?.data) {
      const f = data.data;
      setFormData({
        num_adherent: f.num_adherent || "",
        niveau_vise: f.niveau_vise || "N1",
        date_debut: f.date_debut ? f.date_debut.split("T")[0] : "",
        date_fin_prevue: f.date_fin_prevue
          ? f.date_fin_prevue.split("T")[0]
          : "",
        date_examen_brevet: f.date_examen_brevet
          ? f.date_examen_brevet.split("T")[0]
          : "",
        statut: f.statut || "En cours",
        nb_seances_realisees: f.nb_seances_realisees || 0,
        commentaire_moniteur: f.commentaire_moniteur || "",
        montant_total: f.montant_total ?? "",
        montant_paye: f.montant_paye ?? "",
        mode: "Espèces",
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
    if (!formData.num_adherent)
      newErrors.num_adherent = "L'adhérent est requis";
    if (!formData.niveau_vise) newErrors.niveau_vise = "Le niveau est requis";
    if (!formData.date_debut)
      newErrors.date_debut = "La date de début est requise";
    if (!formData.date_fin_prevue)
      newErrors.date_fin_prevue = "La date de fin prévue est requise";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return;
    if (!validate()) return;
    submittingRef.current = true;
    setLoading(true);
    try {
      if (editMode && id) {
        await update.mutateAsync({ id, data: formData });
      } else {
        await create.mutateAsync(formData);
      }
      navigate("/formations");
    } catch (error) {
      console.error("Error:", error);
    } finally {
      submittingRef.current = false;
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
              {editMode ? "Modifier la formation" : "Nouvelle formation"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {editMode
                ? "Mettez à jour les informations de la formation"
                : "Créez un nouveau programme de formation"}
            </p>
          </div>
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
            <FiBookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
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
                <FiAward className="w-4 h-4 text-gray-400" />
                Niveau visé *
              </span>
            </label>
            <select
              name="niveau_vise"
              value={formData.niveau_vise}
              onChange={handleChange}
              onFocus={() => handleFocus("niveau_vise")}
              onBlur={handleBlur}
              className={inputClasses("niveau_vise")}
            >
              {NIVEAU_FORMATION_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            {errors.niveau_vise && (
              <p className="mt-1.5 text-sm text-red-500">
                {errors.niveau_vise}
              </p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiCalendar className="w-4 h-4 text-gray-400" />
                Date début *
              </span>
            </label>
            <input
              type="date"
              name="date_debut"
              value={formData.date_debut}
              onChange={handleChange}
              onFocus={() => handleFocus("date_debut")}
              onBlur={handleBlur}
              className={inputClasses("date_debut")}
            />
            {errors.date_debut && (
              <p className="mt-1.5 text-sm text-red-500">{errors.date_debut}</p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiClock className="w-4 h-4 text-gray-400" />
                Date fin prévue *
              </span>
            </label>
            <input
              type="date"
              name="date_fin_prevue"
              value={formData.date_fin_prevue}
              onChange={handleChange}
              onFocus={() => handleFocus("date_fin_prevue")}
              onBlur={handleBlur}
              className={inputClasses("date_fin_prevue")}
            />
            {errors.date_fin_prevue && (
              <p className="mt-1.5 text-sm text-red-500">
                {errors.date_fin_prevue}
              </p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiAward className="w-4 h-4 text-gray-400" />
                Date de passage du brevet
              </span>
            </label>
            <input
              type="date"
              name="date_examen_brevet"
              value={formData.date_examen_brevet}
              onChange={handleChange}
              onFocus={() => handleFocus("date_examen_brevet")}
              onBlur={handleBlur}
              className={inputClasses("date_examen_brevet")}
            />
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiCheckCircle className="w-4 h-4 text-gray-400" />
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
              {STATUT_FORMATION_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiDollarSign className="w-4 h-4 text-gray-400" />
                Montant total de la formation (€)
              </span>
            </label>
            <input
              type="number"
              step="0.01"
              name="montant_total"
              value={formData.montant_total}
              onChange={handleChange}
              onFocus={() => handleFocus("montant_total")}
              onBlur={handleBlur}
              className={inputClasses("montant_total")}
              placeholder="Facultatif — laisser vide si gratuite"
              min="0"
            />
          </motion.div>

          {!editMode && Number(formData.montant_total) > 0 && (
            <>
              <motion.div {...fadeInUp}>
                <label className={labelClasses}>
                  <span className="flex items-center gap-2">
                    <FiDollarSign className="w-4 h-4 text-gray-400" />
                    Montant reçu maintenant (€)
                  </span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="montant_paye"
                  value={formData.montant_paye}
                  onChange={handleChange}
                  onFocus={() => handleFocus("montant_paye")}
                  onBlur={handleBlur}
                  className={inputClasses("montant_paye")}
                  placeholder={formData.montant_total || "0.00"}
                />
                <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                  Laisser vide pour ne rien encaisser maintenant. Un solde restant pourra être
                  enregistré ultérieurement.
                </p>
              </motion.div>

              <motion.div {...fadeInUp}>
                <label className={labelClasses}>
                  <span className="flex items-center gap-2">
                    <FiCreditCard className="w-4 h-4 text-gray-400" />
                    Mode de paiement
                  </span>
                </label>
                <select
                  name="mode"
                  value={formData.mode}
                  onChange={handleChange}
                  onFocus={() => handleFocus("mode")}
                  onBlur={handleBlur}
                  className={inputClasses("mode")}
                >
                  {MODE_PAIEMENT_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </motion.div>
            </>
          )}

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiList className="w-4 h-4 text-gray-400" />
                Séances réalisées
              </span>
            </label>
            <input
              type="number"
              name="nb_seances_realisees"
              value={formData.nb_seances_realisees}
              onChange={handleChange}
              onFocus={() => handleFocus("nb_seances_realisees")}
              onBlur={handleBlur}
              className={inputClasses("nb_seances_realisees")}
              min="0"
              placeholder="0"
            />
          </motion.div>

          <motion.div {...fadeInUp} className="md:col-span-2">
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiFileText className="w-4 h-4 text-gray-400" />
                Commentaire du moniteur
              </span>
            </label>
            <textarea
              name="commentaire_moniteur"
              value={formData.commentaire_moniteur}
              onChange={handleChange}
              onFocus={() => handleFocus("commentaire_moniteur")}
              onBlur={handleBlur}
              rows="4"
              className={inputClasses("commentaire_moniteur")}
              placeholder="Suivi de la formation, progression, remarques..."
            />
          </motion.div>
        </div>
      </div>

      {/* Pied de page */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-end gap-3">
        <button
          type="button"
          onClick={() => navigate("/formations")}
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
          {editMode ? "Mettre à jour" : "Créer la formation"}
        </button>
      </div>
    </motion.form>
  );
};

export default FormationForm;
