import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiUser,
  FiDollarSign,
  FiCreditCard,
  FiFileText,
  FiHash,
  FiSave,
  FiX,
  FiClock,
} from "react-icons/fi";
import { usePaiements } from "../../hooks/Paiement/usePaiements";
import { useAdherents } from "../../hooks/Adherent/useAdherents";
import { useAdhesions } from "../../hooks/Adhesion/useAdhesions";
import { useAttributions } from "../../hooks/Attribution/useAttributions";
import { useInscriptions } from "../../hooks/Inscription/useInscriptions";
import { useFormations } from "../../hooks/Formation/useFormations";
import LoadingSpinner from "../Common/LoadingSpinner";
import SearchableSelect from "../Common/SearchableSelect";
import {
  MODE_PAIEMENT_OPTIONS,
  STATUT_PAIEMENT_OPTIONS,
  TYPE_PAIEMENT_OPTIONS,
  STATUT_PAIEMENT,
} from "../../utils/constants";

// Types de paiement pour lesquels la référence pointe vers un enregistrement
// existant lié à l'adhérent (par opposition à "Autre", saisie libre).
const TYPES_AVEC_REFERENCE = ["Adhesion", "Sortie", "Formation", "Caution"];

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

const PaiementForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const editMode = !!id;

  const { useGetById, useCreate, useUpdate } = usePaiements();
  const { useGetAll } = useAdherents();
  const { useGetByAdherent: useAdhesionsByAdherent } = useAdhesions();
  const { useGetByAdherent: useAttributionsByAdherent } = useAttributions();
  const { useGetByAdherent: useInscriptionsByAdherent } = useInscriptions();
  const { useGetByAdherent: useFormationsByAdherent } = useFormations();

  const { data: paiementData, isLoading: loadingData } = useGetById(id);
  const { data: adherentsData, isLoading: loadingAdherents } = useGetAll();

  const create = useCreate();
  const update = useUpdate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [focused, setFocused] = useState(null);
  // Un double-clic (ou un second Entrée pendant que la requête est en vol)
  // déclenche deux mutations avant que le state "loading" n'ait le temps de
  // re-rendre le bouton en disabled — le state React est asynchrone, pas la
  // ref. Ce garde-fou synchrone est ce qui empêche réellement la création de
  // deux paiements pour un seul clic (vérifié : sans lui, deux requêtes
  // quasi simultanées créent bien deux lignes distinctes en base).
  const submittingRef = useRef(false);

  const [formData, setFormData] = useState({
    num_adherent: "",
    montant: "",
    mode: "Espèces",
    type_paiement: "",
    statut: "En attente",
    reference_id: "",
    description: "",
  });

  useEffect(() => {
    if (editMode && id && paiementData?.data) {
      const p = paiementData.data;
      setFormData({
        num_adherent: p.num_adherent || "",
        montant: p.montant || "",
        mode: p.mode || "Espèces",
        type_paiement: p.type_paiement || "",
        statut: p.statut || "En attente",
        reference_id: p.reference_id || "",
        description: p.description || "",
      });
    }
  }, [editMode, id, paiementData]);

  const referenceEnabled = TYPES_AVEC_REFERENCE.includes(formData.type_paiement);

  const { data: adhesionsData, isLoading: loadingAdhesions } =
    useAdhesionsByAdherent(
      referenceEnabled && formData.type_paiement === "Adhesion"
        ? formData.num_adherent
        : undefined,
    );
  const { data: attributionsData, isLoading: loadingAttributions } =
    useAttributionsByAdherent(
      referenceEnabled && formData.type_paiement === "Caution"
        ? formData.num_adherent
        : undefined,
    );
  const { data: inscriptionsData, isLoading: loadingInscriptions } =
    useInscriptionsByAdherent(
      referenceEnabled && formData.type_paiement === "Sortie"
        ? formData.num_adherent
        : undefined,
    );
  const { data: formationsData, isLoading: loadingFormations } =
    useFormationsByAdherent(
      referenceEnabled && formData.type_paiement === "Formation"
        ? formData.num_adherent
        : undefined,
    );

  // Ne considérer que le chargement de la requête réellement active : l'autre
  // est désactivée (enabled:false) et react-query garde son statut à
  // "loading" indéfiniment dans ce cas, ce qui bloquerait le select en
  // "Chargement..." en permanence si on les combinait toutes avec un OR.
  const loadingReferences =
    formData.type_paiement === "Adhesion"
      ? loadingAdhesions
      : formData.type_paiement === "Caution"
        ? loadingAttributions
        : formData.type_paiement === "Sortie"
          ? loadingInscriptions
          : formData.type_paiement === "Formation"
            ? loadingFormations
            : false;

  // Options de référence dynamiques : liées à l'adhérent + type sélectionnés,
  // avec le montant restant à payer pour chaque élément (pré-remplissage du
  // champ Montant lors de la sélection).
  const referenceOptions = useMemo(() => {
    const money = (n) => Number(n || 0);

    if (formData.type_paiement === "Adhesion") {
      // Seule l'adhésion Club a un tarif/paiement suivi (FFESM, assurances
      // sont couvertes par cette cotisation et n'ont rien à régler ici), et
      // seules celles avec un solde restant ont un intérêt à apparaître.
      return (adhesionsData?.data || [])
        .filter((a) => a.type === "Club" && a.statut_paiement !== STATUT_PAIEMENT.PAYE)
        .map((a) => {
          const solde = Math.max(0, money(a.montant) - money(a.montant_paye));
          return {
            value: String(a.id_adhesion),
            label: `Adhésion Club ${a.annee_adhesion} — ${a.statut_paiement} (reste ${solde.toFixed(2)} €)`,
            montant: solde,
          };
        });
    }

    if (formData.type_paiement === "Caution") {
      return (attributionsData?.data || []).map((att) => {
        const enAttente = att.statut_caution === "Aucune";
        const montant = enAttente ? money(att.montant_caution) : 0;
        return {
          value: String(att.id_attribution),
          label: `Matériel ${att.num_inventaire} — Caution ${att.statut_caution}${
            montant > 0 ? ` (${montant.toFixed(2)} €)` : ""
          }`,
          montant,
        };
      });
    }

    if (formData.type_paiement === "Sortie") {
      // Seules les inscriptions à une sortie payante et pas encore soldée
      // ont un intérêt à apparaître ici.
      return (inscriptionsData?.data || [])
        .filter((i) => money(i.montant_du) > 0 && !i.paye)
        .map((i) => {
          const solde = Math.max(0, money(i.montant_du) - money(i.montant_paye));
          const label = i.sortie
            ? `${i.sortie.type} - ${i.sortie.lieu}`
            : `Sortie N°${i.id_sortie}`;
          return {
            value: String(i.id_inscription),
            label: `${label} (reste ${solde.toFixed(2)} €)`,
            montant: solde,
          };
        });
    }

    if (formData.type_paiement === "Formation") {
      return (formationsData?.data || [])
        .filter((f) => money(f.montant_total) > 0 && f.statut_paiement !== STATUT_PAIEMENT.PAYE)
        .map((f) => {
          const solde = Math.max(0, money(f.montant_total) - money(f.montant_paye));
          return {
            value: String(f.id_formation),
            label: `Formation ${f.niveau_vise} — ${f.statut_paiement} (reste ${solde.toFixed(2)} €)`,
            montant: solde,
          };
        });
    }

    return [];
  }, [formData.type_paiement, adhesionsData, attributionsData, inscriptionsData, formationsData]);

  // Réinitialise la référence quand l'adhérent ou le type change (nouvelle
  // saisie uniquement, pour ne pas perturber le chargement d'un paiement
  // existant en mode édition).
  useEffect(() => {
    if (!editMode) {
      setFormData((prev) => ({ ...prev, reference_id: "" }));
    }
  }, [formData.num_adherent, formData.type_paiement, editMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleReferenceChange = (e) => {
    const value = e.target.value;
    const option = referenceOptions.find((o) => o.value === value);
    setFormData((prev) => ({
      ...prev,
      reference_id: value,
      montant: option ? String(option.montant) : prev.montant,
    }));
    if (errors.reference_id)
      setErrors((prev) => ({ ...prev, reference_id: "" }));
  };

  const handleFocus = (name) => setFocused(name);
  const handleBlur = () => setFocused(null);

  const validate = () => {
    const newErrors = {};
    if (!formData.num_adherent)
      newErrors.num_adherent = "L'adhérent est requis";
    if (!formData.montant || formData.montant <= 0)
      newErrors.montant = "Le montant doit être supérieur à 0";
    if (!formData.mode) newErrors.mode = "Le mode est requis";
    if (!formData.type_paiement)
      newErrors.type_paiement = "Le type de paiement est requis";
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
      navigate("/paiements");
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
              {editMode ? "Modifier le paiement" : "Nouveau paiement"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {editMode
                ? "Mettez à jour les informations du paiement"
                : "Enregistrez un nouveau paiement"}
            </p>
          </div>
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
            <FiDollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
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
                <FiDollarSign className="w-4 h-4 text-gray-400" />
                Montant (€) *
              </span>
            </label>
            <input
              type="number"
              step="0.01"
              name="montant"
              value={formData.montant}
              onChange={handleChange}
              onFocus={() => handleFocus("montant")}
              onBlur={handleBlur}
              className={inputClasses("montant")}
              placeholder="0.00"
              min="0"
            />
            {errors.montant && (
              <p className="mt-1.5 text-sm text-red-500">{errors.montant}</p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiCreditCard className="w-4 h-4 text-gray-400" />
                Mode *
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
            {errors.mode && (
              <p className="mt-1.5 text-sm text-red-500">{errors.mode}</p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiFileText className="w-4 h-4 text-gray-400" />
                Type de paiement *
              </span>
            </label>
            <select
              name="type_paiement"
              value={formData.type_paiement}
              onChange={handleChange}
              onFocus={() => handleFocus("type_paiement")}
              onBlur={handleBlur}
              className={inputClasses("type_paiement")}
            >
              <option value="">Sélectionner...</option>
              {TYPE_PAIEMENT_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            {errors.type_paiement && (
              <p className="mt-1.5 text-sm text-red-500">{errors.type_paiement}</p>
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
              onFocus={() => handleFocus("statut")}
              onBlur={handleBlur}
              className={inputClasses("statut")}
            >
              {STATUT_PAIEMENT_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiHash className="w-4 h-4 text-gray-400" />
                Référence
                {referenceEnabled
                  ? " (sélectionner l'élément concerné)"
                  : " (N° adhésion / attribution)"}
              </span>
            </label>
            {referenceEnabled ? (
              <>
                <select
                  name="reference_id"
                  value={formData.reference_id}
                  onChange={handleReferenceChange}
                  onFocus={() => handleFocus("reference_id")}
                  onBlur={handleBlur}
                  className={inputClasses("reference_id")}
                  disabled={!formData.num_adherent || loadingReferences}
                >
                  <option value="">
                    {!formData.num_adherent
                      ? "Sélectionnez d'abord un adhérent..."
                      : loadingReferences
                        ? "Chargement..."
                        : referenceOptions.length === 0
                          ? "Aucun élément trouvé pour cet adhérent"
                          : "Sélectionner..."}
                  </option>
                  {referenceOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {formData.num_adherent &&
                  !loadingReferences &&
                  referenceOptions.length === 0 && (
                    <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                      {formData.type_paiement === "Adhesion"
                        ? "Aucune adhésion trouvée pour cet adhérent."
                        : formData.type_paiement === "Sortie"
                          ? "Aucune inscription à solder pour cet adhérent."
                          : formData.type_paiement === "Formation"
                            ? "Aucune formation à solder pour cet adhérent."
                            : "Aucun prêt de matériel trouvé pour cet adhérent."}
                    </p>
                  )}
              </>
            ) : (
              <input
                type="text"
                name="reference_id"
                value={formData.reference_id}
                onChange={handleChange}
                onFocus={() => handleFocus("reference_id")}
                onBlur={handleBlur}
                className={inputClasses("reference_id")}
                placeholder="Ex : 12"
              />
            )}
          </motion.div>

          <motion.div {...fadeInUp} className="md:col-span-2">
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiFileText className="w-4 h-4 text-gray-400" />
                Description
              </span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              onFocus={() => handleFocus("description")}
              onBlur={handleBlur}
              rows={3}
              className={inputClasses("description")}
              placeholder="Détails complémentaires..."
            />
          </motion.div>
        </div>
      </div>

      {/* Pied de page */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-end gap-3">
        <button
          type="button"
          onClick={() => navigate("/paiements")}
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
          {editMode ? "Mettre à jour" : "Créer le paiement"}
        </button>
      </div>
    </motion.form>
  );
};

export default PaiementForm;
