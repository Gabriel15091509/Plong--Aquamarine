import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiUser,
  FiCalendar,
  FiDollarSign,
  FiCreditCard,
  FiSave,
  FiX,
  FiChevronRight,
  FiTag,
  FiClock,
  FiHash,
  FiUpload,
  FiFile,
  FiCamera,
  FiCheckCircle,
  FiAlertTriangle,
} from "react-icons/fi";
import { useAdhesions } from "../../hooks/Adhesion/useAdhesions";
import { useAdherents } from "../../hooks/Adherent/useAdherents";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../Common/LoadingSpinner";
import SearchableSelect from "../Common/SearchableSelect";
import WebcamCaptureModal from "../Common/WebcamCaptureModal";
import {
  TYPE_ADHESION_OPTIONS,
  STATUT_PAIEMENT_OPTIONS,
  MODE_PAIEMENT_OPTIONS,
} from "../../utils/constants";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

const AdhesionForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const editMode = !!id;
  const { user } = useAuth();
  // Un adhérent qui soumet lui-même sa licence FFESM / assurance (jamais
  // en édition — cette route reste réservée au staff, voir App.jsx) :
  // pas de choix d'adhérent (soi-même, imposé), pas de type "Club" (le
  // backend le refuserait de toute façon — AdhesionService.create), pas de
  // champ montant/paiement. La soumission reste "En attente" jusqu'à
  // validation par le président/trésorier (AdhesionList affiche le statut).
  const isSelfSubmission = !editMode && user?.role === "adherent";

  const { useGetById, useCreate, useUpdate, useAnalysePhoto } = useAdhesions();
  const { useGetAll } = useAdherents();

  const { data: adhesionData, isLoading: loadingData } = useGetById(id);
  const { data: adherentsData, isLoading: loadingAdherents } = useGetAll();

  const create = useCreate();
  const update = useUpdate();
  const analysePhoto = useAnalysePhoto();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [focused, setFocused] = useState(null);
  const [photoAnalysis, setPhotoAnalysis] = useState(null);
  const submittingRef = useRef(false);
  const fileInputRef = useRef(null);
  // Distingue "champ vide" de "champ modifié par l'utilisateur", pour ne
  // jamais écraser sa saisie avec l'auto-remplissage OCR, et pour savoir
  // quels champs vider si la photo est retirée.
  const touchedFieldsRef = useRef({});
  // Mémorise quels champs ont été remplis automatiquement par l'OCR (et pas
  // par l'utilisateur), pour pouvoir les vider si la photo est retirée.
  const autoFilledFieldsRef = useRef({});

  const [formData, setFormData] = useState({
    num_adherent: "",
    type: "Club",
    date_debut: "",
    date_fin: "",
    montant: "",
    num_licence_ffesm: "",
    statut_paiement: "En attente",
    annee_adhesion: new Date().getFullYear(),
    montant_paye: "",
    mode: "Espèces",
  });
  const [documentFile, setDocumentFile] = useState(null);
  const [existingDocumentPath, setExistingDocumentPath] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);
  const [showWebcam, setShowWebcam] = useState(false);

  // Auto-sélectionne l'adhérent connecté comme seul "adhérent" possible
  // (le backend, côté identite-service, ne renvoie de toute façon que sa
  // propre fiche à un appelant avec le rôle adherent — voir le même motif
  // dans AdherentRecapCard) et verrouille le type sur le premier choix
  // non-Club, pour ne jamais laisser un état incohérent avec ce que le
  // serveur acceptera.
  useEffect(() => {
    if (!isSelfSubmission || !adherentsData?.data?.length) return;
    const soi = adherentsData.data[0];
    setFormData((prev) => ({
      ...prev,
      num_adherent: soi.num_adherent,
      type: prev.type === "Club" ? "FFESM" : prev.type,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSelfSubmission, adherentsData]);

  // ✅ En création, dès qu'on sélectionne l'adhérent, on reprend son n° de
  // licence FFESM depuis sa fiche Adherent (source de vérité, plutôt que la
  // dernière adhésion FFESM en date qui n'est pas toujours fiable/à jour).
  // En édition, la valeur vient déjà de l'adhésion en cours de modification.
  useEffect(() => {
    if (editMode || !formData.num_adherent) return;
    const adherent = adherentsData?.data?.find(
      (a) => a.num_adherent === formData.num_adherent,
    );
    setFormData((prev) => ({
      ...prev,
      num_licence_ffesm: adherent?.num_licence_ffesm || "",
    }));
  }, [formData.num_adherent, adherentsData, editMode]);

  useEffect(() => {
    if (editMode && id && adhesionData?.data) {
      const adhesion = adhesionData.data;
      setFormData({
        num_adherent: adhesion.num_adherent || "",
        type: adhesion.type || "Club",
        date_debut: adhesion.date_debut
          ? adhesion.date_debut.split("T")[0]
          : "",
        date_fin: adhesion.date_fin ? adhesion.date_fin.split("T")[0] : "",
        montant: adhesion.montant ?? "",
        num_licence_ffesm: adhesion.num_licence_ffesm || "",
        statut_paiement: adhesion.statut_paiement || "En attente",
        annee_adhesion: adhesion.annee_adhesion || new Date().getFullYear(),
      });
      setExistingDocumentPath(adhesion.document_path || null);
    }
  }, [editMode, id, adhesionData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    touchedFieldsRef.current[name] = true;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const applyDocumentFile = (file) => {
    setDocumentFile(file);
    setPhotoAnalysis(null);
    setFilePreviewUrl((prevUrl) => {
      if (prevUrl) URL.revokeObjectURL(prevUrl);
      return file && file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : null;
    });
  };

  const handleFileChange = (e) => {
    applyDocumentFile(e.target.files?.[0] || null);
  };

  const handleWebcamCapture = (file) => {
    applyDocumentFile(file);
  };

  const handleRemoveDocument = () => {
    applyDocumentFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    // Les champs remplis automatiquement depuis cette photo redeviennent
    // vides quand on la retire — sauf ceux que l'utilisateur a modifiés
    // lui-même entre-temps (on ne touche jamais à sa saisie).
    const autoFilled = autoFilledFieldsRef.current;
    const touched = touchedFieldsRef.current;
    const fieldsToReset = Object.keys(autoFilled).filter(
      (field) => autoFilled[field] && !touched[field],
    );
    if (fieldsToReset.length > 0) {
      setFormData((prev) => {
        const next = { ...prev };
        fieldsToReset.forEach((field) => {
          next[field] = "";
        });
        return next;
      });
    }
    autoFilledFieldsRef.current = {};
  };

  useEffect(() => {
    return () => {
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    };
  }, [filePreviewUrl]);

  // Vérification "un peu" de cohérence, non bloquante : dès qu'une photo
  // (webcam ou import) et l'adhérent sont renseignés, on lance l'OCR en
  // arrière-plan pour repérer les cas manifestement incohérents (mauvaise
  // photo, mauvais adhérent, mauvaise licence) sans empêcher la saisie.
  useEffect(() => {
    if (
      !documentFile ||
      !documentFile.type.startsWith("image/") ||
      !formData.num_adherent
    ) {
      return;
    }
    let cancelled = false;
    analysePhoto.mutate(
      {
        photoFile: documentFile,
        num_adherent: formData.num_adherent,
        type: formData.type,
        num_licence_ffesm: formData.num_licence_ffesm,
        date_debut: formData.date_debut,
        date_fin: formData.date_fin,
      },
      {
        onSuccess: (response) => {
          if (cancelled) return;
          const resultat = response.data;
          setPhotoAnalysis(resultat);
          // L'identité de l'adhérent (nom + prénom) est confirmée par la
          // photo : on peut alors faire confiance à l'OCR pour compléter les
          // autres champs, mais seulement ceux encore vides — on ne
          // remplace jamais une valeur déjà saisie par l'utilisateur.
          const identiteConfirmee =
            resultat.correspondances.nom === true &&
            resultat.correspondances.prenom === true;
          if (identiteConfirmee && resultat.extraction) {
            const touched = touchedFieldsRef.current;
            const autoFilled = autoFilledFieldsRef.current;
            setFormData((prev) => {
              const next = { ...prev };
              if (!prev.num_licence_ffesm && !touched.num_licence_ffesm && resultat.extraction.num_licence_ffesm) {
                next.num_licence_ffesm = resultat.extraction.num_licence_ffesm;
                autoFilled.num_licence_ffesm = true;
              }
              if (!prev.date_debut && !touched.date_debut && resultat.extraction.date_debut) {
                next.date_debut = resultat.extraction.date_debut;
                autoFilled.date_debut = true;
              }
              if (!prev.date_fin && !touched.date_fin && resultat.extraction.date_fin) {
                next.date_fin = resultat.extraction.date_fin;
                autoFilled.date_fin = true;
              }
              return next;
            });
          }
        },
      },
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentFile]);

  const handleFocus = (name) => setFocused(name);
  const handleBlur = () => setFocused(null);

  const isClub = formData.type === "Club";
  const typeOptions = isSelfSubmission
    ? TYPE_ADHESION_OPTIONS.filter((opt) => opt.value !== "Club")
    : TYPE_ADHESION_OPTIONS;

  const validate = () => {
    const newErrors = {};
    if (!formData.num_adherent)
      newErrors.num_adherent = "L'adhérent est requis";
    if (!formData.type) newErrors.type = "Le type est requis";
    if (!formData.date_debut)
      newErrors.date_debut = "La date de début est requise";
    if (!formData.date_fin) newErrors.date_fin = "La date de fin est requise";
    if (isClub && (!formData.montant || formData.montant <= 0)) {
      newErrors.montant = "Le montant doit être supérieur à 0";
    }
    if (!formData.annee_adhesion)
      newErrors.annee_adhesion = "L'année est requise";
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
      navigate("/adhesions");
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
              {editMode
                ? "Modifier l'adhésion"
                : isSelfSubmission
                  ? "Soumettre ma licence / assurance"
                  : "Nouvelle adhésion"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {editMode
                ? "Mettez à jour les informations d'adhésion"
                : isSelfSubmission
                  ? "En attente de validation par le président/trésorier avant d'être prise en compte."
                  : "Ajoutez une nouvelle adhésion au club"}
            </p>
          </div>
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
            <FiCreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </div>

      {/* Corps du formulaire */}
      <div className="p-6 space-y-6">
        {isSelfSubmission && (
          <motion.div
            {...fadeInUp}
            className="flex items-start gap-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-4 py-3"
          >
            <FiAlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700 dark:text-amber-400">
              Votre document sera visible par le bureau avec le statut
              <span className="font-medium"> « En attente »</span>. Il ne
              sera pris en compte par le système (dossier complet, éligibilité
              aux sorties, etc.) qu'une fois validé par le président ou le
              trésorier.
            </p>
          </motion.div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <motion.div {...fadeInUp}>
            {isSelfSubmission ? (
              <>
                <label className={labelClasses}>
                  <span className="flex items-center gap-2">
                    <FiUser className="w-4 h-4 text-gray-400" />
                    Adhérent
                  </span>
                </label>
                <div className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 text-gray-600 dark:text-gray-300">
                  {adherentsData?.data?.[0]
                    ? `${adherentsData.data[0].civilite} ${adherentsData.data[0].nom} ${adherentsData.data[0].prenom} (vous)`
                    : "…"}
                </div>
              </>
            ) : (
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
              {typeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} {opt.obligatoire ? "*" : "(facultatif)"}
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
                <FiCalendar className="w-4 h-4 text-gray-400" />
                Date fin *
              </span>
            </label>
            <input
              type="date"
              name="date_fin"
              value={formData.date_fin}
              onChange={handleChange}
              onFocus={() => handleFocus("date_fin")}
              onBlur={handleBlur}
              className={inputClasses("date_fin")}
            />
            {errors.date_fin && (
              <p className="mt-1.5 text-sm text-red-500">{errors.date_fin}</p>
            )}
          </motion.div>

          {isClub && (
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
              />
              {errors.montant && (
                <p className="mt-1.5 text-sm text-red-500">
                  {errors.montant}
                </p>
              )}
            </motion.div>
          )}

          {isClub && editMode && (
            <motion.div {...fadeInUp}>
              <label className={labelClasses}>
                <span className="flex items-center gap-2">
                  <FiClock className="w-4 h-4 text-gray-400" />
                  Statut paiement
                </span>
              </label>
              <select
                name="statut_paiement"
                value={formData.statut_paiement}
                onChange={handleChange}
                onFocus={() => handleFocus("statut_paiement")}
                onBlur={handleBlur}
                className={inputClasses("statut_paiement")}
              >
                {STATUT_PAIEMENT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </motion.div>
          )}
          {isClub && !editMode && (
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
                  placeholder={formData.montant || "0.00"}
                />
                <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                  Laisser vide pour un paiement intégral. Si inférieur au montant, le solde restera
                  à régler ultérieurement (statut "Partiel").
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
          {!isClub && (
            <motion.div {...fadeInUp} className="md:col-span-2">
              <p className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/30 rounded-lg px-4 py-2.5 border border-gray-200 dark:border-gray-700">
                Ce type d'adhésion n'a pas de tarif ni de paiement à saisir : seule
                l'adhésion Club fait l'objet d'un règlement dans l'application.
              </p>
            </motion.div>
          )}

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiHash className="w-4 h-4 text-gray-400" />
                N° Licence FFESM
              </span>
            </label>
            <input
              type="text"
              name="num_licence_ffesm"
              value={formData.num_licence_ffesm}
              onChange={handleChange}
              onFocus={() => handleFocus("num_licence_ffesm")}
              onBlur={handleBlur}
              className={inputClasses("num_licence_ffesm")}
              placeholder="FF12345"
            />
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiCalendar className="w-4 h-4 text-gray-400" />
                Année *
              </span>
            </label>
            <input
              type="number"
              name="annee_adhesion"
              value={formData.annee_adhesion}
              onChange={handleChange}
              onFocus={() => handleFocus("annee_adhesion")}
              onBlur={handleBlur}
              className={inputClasses("annee_adhesion")}
              placeholder="2024"
            />
            {errors.annee_adhesion && (
              <p className="mt-1.5 text-sm text-red-500">
                {errors.annee_adhesion}
              </p>
            )}
          </motion.div>

          <motion.div {...fadeInUp} className="md:col-span-2">
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiUpload className="w-4 h-4 text-gray-400" />
                Photo / scan du document (facultatif)
              </span>
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className={`${inputClasses("document")} flex-1`}
              />
              <button
                type="button"
                onClick={() => setShowWebcam(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors whitespace-nowrap"
              >
                <FiCamera className="w-4 h-4" />
                Prendre une photo
              </button>
            </div>
            {documentFile ? (
              <div className="mt-1.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5 truncate">
                    <FiFile className="w-3.5 h-3.5 flex-shrink-0" />
                    {documentFile.name}
                  </p>
                  <button
                    type="button"
                    onClick={handleRemoveDocument}
                    title="Retirer le document"
                    className="p-1 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex-shrink-0 transition-colors"
                  >
                    <FiX className="w-3.5 h-3.5" />
                  </button>
                </div>
                {filePreviewUrl && (
                  <div className="relative mt-2 inline-block">
                    <img
                      src={filePreviewUrl}
                      alt="Aperçu du document"
                      className="max-h-48 rounded-lg border border-gray-200 dark:border-gray-600 object-contain"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveDocument}
                      title="Retirer la photo"
                      className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                    >
                      <FiX className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                {analysePhoto.isPending && (
                  <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-gray-400 border-t-transparent" />
                    Vérification de la cohérence de la photo...
                  </div>
                )}
                {photoAnalysis && !analysePhoto.isPending && (
                  <div
                    className={`mt-2 p-3 rounded-lg border text-sm ${
                      photoAnalysis.coherent
                        ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
                        : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400"
                    }`}
                  >
                    {photoAnalysis.coherent ? (
                      <p className="flex items-center gap-1.5 font-medium">
                        <FiCheckCircle className="w-4 h-4 flex-shrink-0" />
                        La photo semble cohérente avec les informations saisies.
                      </p>
                    ) : (
                      <div>
                        <p className="flex items-center gap-1.5 font-medium">
                          <FiAlertTriangle className="w-4 h-4 flex-shrink-0" />
                          À vérifier avant d&apos;enregistrer :
                        </p>
                        <ul className="mt-1 ml-5 list-disc space-y-0.5">
                          {photoAnalysis.avertissements.map((message) => (
                            <li key={message}>{message}</li>
                          ))}
                        </ul>
                        <p className="mt-1.5 text-xs opacity-80">
                          Vérification automatique indicative (lecture par OCR) — vous pouvez enregistrer quand même si le document est correct.
                        </p>
                      </div>
                    )}
                  </div>
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

      {showWebcam && (
        <WebcamCaptureModal
          title={`Photo — ${TYPE_ADHESION_OPTIONS.find((opt) => opt.value === formData.type)?.label || "document"}`}
          onCapture={handleWebcamCapture}
          onClose={() => setShowWebcam(false)}
        />
      )}

      {/* Pied de page */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-end gap-3">
        <button
          type="button"
          onClick={() => navigate("/adhesions")}
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
          {editMode
            ? "Mettre à jour"
            : isSelfSubmission
              ? "Soumettre pour validation"
              : "Créer l'adhésion"}
        </button>
      </div>
    </motion.form>
  );
};

export default AdhesionForm;
