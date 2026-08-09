import React, { useState, useEffect, useRef } from "react";
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
  FiCamera,
  FiCheckCircle,
  FiAlertTriangle,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { useCertificats } from "../../hooks/CertificatMedical/useCertificats";
import { useAdherents } from "../../hooks/Adherent/useAdherents";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../Common/LoadingSpinner";
import SearchableSelect from "../Common/SearchableSelect";
import WebcamCaptureModal from "../Common/WebcamCaptureModal";
import { CERTIFICAT_TYPE_OPTIONS } from "../../utils/constants";
import api from "../../services/api";

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
  const { user } = useAuth();
  // Même schéma que AdhesionForm.jsx : un adhérent qui soumet lui-même son
  // certificat médical (jamais en édition, réservée au staff — voir
  // App.jsx) n'a pas à choisir l'adhérent (imposé) ni à saisir un statut
  // (champ de suivi géré par le staff). Reste "En attente" jusqu'à
  // validation par le président.
  const isSelfSubmission = !editMode && user?.role === "adherent";

  const { useGetById, useCreate, useUpdate, useAnalysePhoto } = useCertificats();
  const { useGetAll } = useAdherents();

  const { data: certificatData, isLoading: loadingData } = useGetById(id);
  const { data: adherentsData, isLoading: loadingAdherents } = useGetAll();

  const create = useCreate();
  const update = useUpdate();
  const analysePhoto = useAnalysePhoto();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [focused, setFocused] = useState(null);
  const [showWebcam, setShowWebcam] = useState(false);
  const [photoAnalysis, setPhotoAnalysis] = useState(null);
  const fileInputRef = useRef(null);
  // `date_delivrance` a une valeur par défaut (aujourd'hui) dès le départ :
  // un simple `!prev.champ` ne suffit donc pas à savoir si l'auto-remplissage
  // depuis la photo peut s'appliquer. On ne remplace que les champs que
  // l'utilisateur n'a pas lui-même modifiés.
  const touchedFieldsRef = useRef({});
  // Mémorise quels champs ont été remplis automatiquement par l'OCR (et pas
  // par l'utilisateur), pour pouvoir les vider si la photo est retirée.
  const autoFilledFieldsRef = useRef({});

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
  const [openingDocument, setOpeningDocument] = useState(false);

  // Document chiffré au repos, jamais accessible via une URL statique : on
  // le récupère par la route authentifiée puis on l'ouvre depuis un blob.
  // L'onglet doit être ouvert de façon synchrone, dans le même tick que le
  // clic — un `window.open` appelé après un `await` n'est plus rattaché au
  // geste utilisateur et se fait bloquer silencieusement par le navigateur
  // (pas d'erreur, juste rien qui s'affiche).
  const handleViewExistingDocument = async () => {
    // Sans "noopener"/"noreferrer" ici (contrairement à un <a target="_blank">
    // classique) : ces deux flags forcent window.open() à renvoyer null (pas
    // de référence vers l'onglet créé), ce qui empêchait justement la ligne
    // `tab.location.href = url` plus bas de s'exécuter — l'onglet ouvert
    // restait sur about:blank indéfiniment (page blanche, sans la moindre
    // erreur ni toast). Confirmé en testant directement window.open() dans
    // Chromium. Pas de risque ici : l'onglet ne navigue jamais vers une URL
    // fournie par un tiers, seulement vers un blob qu'on vient de créer.
    const tab = window.open("", "_blank");
    setOpeningDocument(true);
    try {
      const response = await api.get(`/certificats-medicaux/${id}/document`, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(response.data);
      if (tab) {
        tab.location.href = url;
      } else {
        toast.error(
          "Le navigateur a bloqué l'ouverture de l'onglet. Autorisez les pop-ups pour ce site.",
        );
      }
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
      if (tab) tab.close();
      toast.error(
        error.response?.data?.message || "Impossible d'ouvrir le document",
      );
    } finally {
      setOpeningDocument(false);
    }
  };

  // Auto-sélectionne l'adhérent connecté (le backend, côté identite-service,
  // ne renvoie de toute façon que sa propre fiche à un appelant avec le rôle
  // adherent — même motif que AdhesionForm.jsx).
  useEffect(() => {
    if (!isSelfSubmission || !adherentsData?.data?.length) return;
    const soi = adherentsData.data[0];
    setFormData((prev) => ({ ...prev, num_adherent: soi.num_adherent }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSelfSubmission, adherentsData]);

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
  // photo, mauvais adhérent) sans empêcher la saisie. Ne dépend pas du
  // médecin/des dates déjà saisis : ce sont justement les champs que
  // l'analyse peut pré-remplir toute seule (voir onSuccess ci-dessous).
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
        medecin: formData.medecin,
        date_validite: formData.date_validite,
        date_delivrance: formData.date_delivrance,
      },
      {
        onSuccess: (response) => {
          if (cancelled) return;
          const resultat = response.data;
          setPhotoAnalysis(resultat);
          // L'identité de l'adhérent (nom + prénom) est confirmée par la
          // photo : on peut alors faire confiance à l'OCR pour compléter les
          // autres champs, mais seulement ceux que l'utilisateur n'a pas
          // lui-même déjà modifiés (et non simplement "vides" : date_delivrance
          // a une valeur par défaut dès l'ouverture du formulaire).
          const identiteConfirmee =
            resultat.correspondances.nom === true &&
            resultat.correspondances.prenom === true;
          if (identiteConfirmee && resultat.extraction) {
            const touched = touchedFieldsRef.current;
            const autoFilled = autoFilledFieldsRef.current;
            setFormData((prev) => {
              const next = { ...prev };
              if (!touched.medecin && resultat.extraction.medecin) {
                next.medecin = resultat.extraction.medecin;
                autoFilled.medecin = true;
              }
              if (!touched.date_delivrance && resultat.extraction.date_delivrance) {
                next.date_delivrance = resultat.extraction.date_delivrance;
                autoFilled.date_delivrance = true;
              }
              if (!touched.date_validite && resultat.extraction.date_validite) {
                next.date_validite = resultat.extraction.date_validite;
                autoFilled.date_validite = true;
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
              {editMode
                ? "Modifier le certificat"
                : isSelfSubmission
                  ? "Soumettre mon certificat médical"
                  : "Nouveau certificat"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {editMode
                ? "Mettez à jour les informations du certificat"
                : isSelfSubmission
                  ? "En attente de validation par le président avant d'être pris en compte."
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
        {isSelfSubmission && (
          <motion.div
            {...fadeInUp}
            className="flex items-start gap-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-4 py-3"
          >
            <FiAlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700 dark:text-amber-400">
              Votre certificat sera visible par le bureau avec le statut
              <span className="font-medium"> « En attente »</span>. Il ne
              sera pris en compte par le système (dossier complet,
              éligibilité aux sorties, etc.) qu'une fois validé par le
              président.
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
              {CERTIFICAT_TYPE_OPTIONS.map((opt) => (
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

          {!isSelfSubmission && (
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
          )}

          <motion.div {...fadeInUp} className="md:col-span-2">
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiUpload className="w-4 h-4 text-gray-400" />
                Photo / scan du certificat (facultatif)
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
                          Vérification automatique indicative (lecture par OCR) — vous pouvez enregistrer quand même si le certificat est correct.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              existingDocumentPath && (
                <button
                  type="button"
                  onClick={handleViewExistingDocument}
                  disabled={openingDocument}
                  className="mt-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5 disabled:opacity-50"
                >
                  <FiFile className="w-3.5 h-3.5" />
                  {openingDocument ? "Ouverture..." : "Voir le document actuel"}
                </button>
              )
            )}
          </motion.div>
        </div>
      </div>

      {showWebcam && (
        <WebcamCaptureModal
          title="Photo du certificat"
          onCapture={handleWebcamCapture}
          onClose={() => setShowWebcam(false)}
        />
      )}

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
          {editMode
            ? "Mettre à jour"
            : isSelfSubmission
              ? "Soumettre pour validation"
              : "Créer le certificat"}
        </button>
      </div>
    </motion.form>
  );
};

export default CertificatForm;
