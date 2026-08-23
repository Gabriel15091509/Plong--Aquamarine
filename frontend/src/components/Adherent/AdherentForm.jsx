import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiAward,
  FiFileText,
  FiHeart,
  FiHash,
  FiDroplet,
  FiTag,
  FiCamera,
  FiSave,
  FiX,
  FiUserPlus,
} from "react-icons/fi";
import { useAdherents } from "../../hooks/Adherent/useAdherents";
import { useUsers } from "../../hooks/User/useUsers";
import LoadingSpinner from "../Common/LoadingSpinner";
import { sendWelcomeEmailIfNeeded } from "../../utils/welcomeEmail";
import {
  NIVEAU_OPTIONS,
  STATUT_ADHERENT_OPTIONS,
  NB_PLONGEES_MIN_PAR_NIVEAU,
} from "../../utils/constants";
import { photoUrl } from "../../utils/photoUrl";

const CIVILITE_OPTIONS = ["M.", "Mme", "Mlle"];

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

const AdherentForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const editMode = !!id;

  const { useGetById, useCreate, useUpdate } = useAdherents();
  const { useUpdatePhoto } = useUsers();
  const { data, isLoading: loadingData } = useGetById(id);
  const create = useCreate();
  const update = useUpdate();
  const updatePhoto = useUpdatePhoto();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [focused, setFocused] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const [formData, setFormData] = useState({
    civilite: "M.",
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    adresse: "",
    date_naissance: "",
    niveau: "Baptême",
    date_obtention_niveau: "",
    num_brevet: "",
    num_licence_ffesm: "",
    date_inscription: "",
    contact_urgence: "",
    statut: "Actif",
    nb_plongees_total: 0,
    est_invite: false,
  });

  useEffect(() => {
    if (editMode && id && data?.data) {
      const a = data.data;
      setFormData({
        civilite: a.civilite || "M.",
        nom: a.nom || "",
        prenom: a.prenom || "",
        email: a.email || "",
        telephone: a.telephone || "",
        adresse: a.adresse || "",
        date_naissance: a.date_naissance ? a.date_naissance.split("T")[0] : "",
        niveau: a.niveau || "Baptême",
        date_obtention_niveau: a.date_obtention_niveau
          ? a.date_obtention_niveau.split("T")[0]
          : "",
        num_brevet: a.num_brevet || "",
        num_licence_ffesm: a.num_licence_ffesm || "",
        date_inscription: a.date_inscription
          ? a.date_inscription.split("T")[0]
          : "",
        contact_urgence: a.contact_urgence || "",
        statut: a.statut || "Actif",
        nb_plongees_total: a.nb_plongees_total ?? 0,
        est_invite: a.est_invite || false,
      });
    }
  }, [editMode, id, data]);

  // Niveaux réellement accessibles pour un nombre de plongées donné (Baptême
  // toujours disponible, aucun minimum) — le nombre de plongées de
  // l'adhérent pilote dynamiquement les niveaux qu'il peut se voir attribuer.
  const niveauxDisponibles = (nbPlongees) =>
    NIVEAU_OPTIONS.filter((n) => {
      const min = NB_PLONGEES_MIN_PAR_NIVEAU[n];
      return !min || Number(nbPlongees) >= min;
    });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "nb_plongees_total") {
        // Si le niveau actuel n'est plus atteignable avec ce nombre de
        // plongées, on redescend automatiquement au meilleur niveau encore
        // valide (jamais l'inverse : on ne force pas les plongées à monter).
        const disponibles = niveauxDisponibles(value);
        if (!disponibles.includes(prev.niveau)) {
          next.niveau = disponibles[disponibles.length - 1] || "Baptême";
        }
      }
      // Le baptême n'est pas un niveau breveté : pas de date d'obtention, de
      // brevet, ni de licence FFESM.
      if (next.niveau === "Baptême" && prev.niveau !== "Baptême") {
        next.date_obtention_niveau = "";
        next.num_brevet = "";
        next.num_licence_ffesm = "";
      }
      return next;
    });
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleFocus = (name) => setFocused(name);
  const handleBlur = () => setFocused(null);

  const validate = () => {
    const newErrors = {};
    if (!formData.nom) newErrors.nom = "Le nom est requis";
    if (!formData.prenom) newErrors.prenom = "Le prénom est requis";
    if (!formData.email) {
      newErrors.email = "L'email est requis";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email invalide";
    }
    if (!formData.telephone) newErrors.telephone = "Le téléphone est requis";
    if (!formData.date_naissance)
      newErrors.date_naissance = "La date de naissance est requise";
    if (!formData.date_inscription)
      newErrors.date_inscription = "La date d'inscription est requise";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      let result;
      if (editMode && id) {
        result = await update.mutateAsync({ id, data: formData });
      } else {
        result = await create.mutateAsync(formData);
        await sendWelcomeEmailIfNeeded(result);
      }
      if (editMode && photoFile && data?.data?.user_id) {
        const photoFormData = new FormData();
        photoFormData.append("photo", photoFile);
        await updatePhoto.mutateAsync({
          id: data.data.user_id,
          formData: photoFormData,
        });
      }
      navigate("/adherents");
    } catch (error) {
      console.error("Échec de l'enregistrement de l'adhérent :", error);
      toast.error(
        error.response?.data?.message || "Erreur lors de l'enregistrement",
      );
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

  const currentPhoto = photoPreview || photoUrl(data?.data?.photo);
  const isBapteme = formData.niveau === "Baptême";

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
              {editMode ? "Modifier l'adhérent" : "Nouvel adhérent"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {editMode
                ? "Mettez à jour les informations de l'adhérent"
                : "Ajoutez un nouveau membre au club"}
            </p>
          </div>
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
            <FiUserPlus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </div>

      {/* Corps du formulaire */}
      <div className="p-6 space-y-6">
        {editMode && (
          <motion.div {...fadeInUp} className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center border border-gray-200 dark:border-gray-600">
              {currentPhoto ? (
                <img
                  src={currentPhoto}
                  alt="Photo d'identité"
                  className="w-full h-full object-cover"
                />
              ) : (
                <FiUser className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div>
              <label className={labelClasses}>
                <span className="flex items-center gap-2">
                  <FiCamera className="w-4 h-4 text-gray-400" />
                  Photo d'identité
                </span>
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoChange}
                className="text-sm text-gray-600 dark:text-gray-400"
              />
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <motion.div
            {...fadeInUp}
            className="md:col-span-2 flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30"
          >
            <input
              type="checkbox"
              id="est_invite"
              checked={formData.est_invite}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, est_invite: e.target.checked }))
              }
              className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="est_invite" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              <span className="font-medium">Invité (non-adhérent)</span>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Fiche créée pour une personne qui n&apos;est pas membre du club (ex. un baptême
                pour un invité). Ses inscriptions aux sorties seront facturées au tarif
                non-adhérent au lieu du tarif adhérent, et elle ne recevra pas les communications
                ciblées du club.
              </p>
            </label>
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiUser className="w-4 h-4 text-gray-400" />
                Civilité
              </span>
            </label>
            <select
              name="civilite"
              value={formData.civilite}
              onChange={handleChange}
              onFocus={() => handleFocus("civilite")}
              onBlur={handleBlur}
              className={inputClasses("civilite")}
            >
              {CIVILITE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiUser className="w-4 h-4 text-gray-400" />
                Nom *
              </span>
            </label>
            <input
              type="text"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              onFocus={() => handleFocus("nom")}
              onBlur={handleBlur}
              className={inputClasses("nom")}
              placeholder="Dupont"
            />
            {errors.nom && (
              <p className="mt-1.5 text-sm text-red-500">{errors.nom}</p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiUser className="w-4 h-4 text-gray-400" />
                Prénom *
              </span>
            </label>
            <input
              type="text"
              name="prenom"
              value={formData.prenom}
              onChange={handleChange}
              onFocus={() => handleFocus("prenom")}
              onBlur={handleBlur}
              className={inputClasses("prenom")}
              placeholder="Jean"
            />
            {errors.prenom && (
              <p className="mt-1.5 text-sm text-red-500">{errors.prenom}</p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiMail className="w-4 h-4 text-gray-400" />
                Email *
              </span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onFocus={() => handleFocus("email")}
              onBlur={handleBlur}
              className={inputClasses("email")}
              placeholder="jean.dupont@email.com"
            />
            {errors.email && (
              <p className="mt-1.5 text-sm text-red-500">{errors.email}</p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiPhone className="w-4 h-4 text-gray-400" />
                Téléphone *
              </span>
            </label>
            <input
              type="tel"
              name="telephone"
              value={formData.telephone}
              onChange={handleChange}
              onFocus={() => handleFocus("telephone")}
              onBlur={handleBlur}
              className={inputClasses("telephone")}
              placeholder="06 12 34 56 78"
            />
            {errors.telephone && (
              <p className="mt-1.5 text-sm text-red-500">{errors.telephone}</p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiCalendar className="w-4 h-4 text-gray-400" />
                Date de naissance *
              </span>
            </label>
            <input
              type="date"
              name="date_naissance"
              value={formData.date_naissance}
              onChange={handleChange}
              onFocus={() => handleFocus("date_naissance")}
              onBlur={handleBlur}
              className={inputClasses("date_naissance")}
            />
            {errors.date_naissance && (
              <p className="mt-1.5 text-sm text-red-500">
                {errors.date_naissance}
              </p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiMapPin className="w-4 h-4 text-gray-400" />
                Adresse
              </span>
            </label>
            <input
              type="text"
              name="adresse"
              value={formData.adresse}
              onChange={handleChange}
              onFocus={() => handleFocus("adresse")}
              onBlur={handleBlur}
              className={inputClasses("adresse")}
              placeholder="12 rue de la Plage"
            />
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiHeart className="w-4 h-4 text-gray-400" />
                Contact d'urgence
              </span>
            </label>
            <input
              type="text"
              name="contact_urgence"
              value={formData.contact_urgence}
              onChange={handleChange}
              onFocus={() => handleFocus("contact_urgence")}
              onBlur={handleBlur}
              className={inputClasses("contact_urgence")}
              placeholder="Marie Dupont - 06 98 76 54 32"
            />
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiCalendar className="w-4 h-4 text-gray-400" />
                Date d'inscription *
              </span>
            </label>
            <input
              type="date"
              name="date_inscription"
              value={formData.date_inscription}
              onChange={handleChange}
              onFocus={() => handleFocus("date_inscription")}
              onBlur={handleBlur}
              className={inputClasses("date_inscription")}
            />
            {errors.date_inscription && (
              <p className="mt-1.5 text-sm text-red-500">
                {errors.date_inscription}
              </p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiTag className="w-4 h-4 text-gray-400" />
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
              {STATUT_ADHERENT_OPTIONS
                // "En formation" n'est plus une saisie libre : ce statut ne
                // doit refléter qu'une vraie formation "En cours" (mis à
                // jour automatiquement à la création/clôture/ajournement
                // d'une formation) — retiré des choix ici, sauf s'il s'agit
                // déjà de la valeur actuelle (auquel cas on l'affiche
                // encore, pour ne pas masquer l'état réel de l'adhérent).
                .filter((opt) => opt !== "En formation" || formData.statut === "En formation")
                .map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
            </select>
            {formData.statut === "En formation" && (
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                Statut dérivé automatiquement des formations en cours de l&apos;adhérent — se met à jour tout seul.
              </p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiAward className="w-4 h-4 text-gray-400" />
                Niveau
              </span>
            </label>
            <select
              name="niveau"
              value={formData.niveau}
              onChange={handleChange}
              onFocus={() => handleFocus("niveau")}
              onBlur={handleBlur}
              className={inputClasses("niveau")}
            >
              {niveauxDisponibles(formData.nb_plongees_total).map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiDroplet className="w-4 h-4 text-gray-400" />
                Nombre de plongées club
              </span>
            </label>
            <input
              type="number"
              min="0"
              name="nb_plongees_total"
              value={formData.nb_plongees_total}
              onChange={handleChange}
              onFocus={() => handleFocus("nb_plongees_total")}
              onBlur={handleBlur}
              className={inputClasses("nb_plongees_total")}
            />
            {(() => {
              const prochain = NIVEAU_OPTIONS.find(
                (n) =>
                  NB_PLONGEES_MIN_PAR_NIVEAU[n] &&
                  Number(formData.nb_plongees_total) < NB_PLONGEES_MIN_PAR_NIVEAU[n],
              );
              return (
                <p className="mt-1 text-xs text-gray-400">
                  {prochain
                    ? `${NB_PLONGEES_MIN_PAR_NIVEAU[prochain]} plongées requises pour passer "${prochain}"`
                    : "Nombre suffisant pour tous les niveaux"}
                </p>
              );
            })()}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiCalendar className="w-4 h-4 text-gray-400" />
                Date d'obtention du niveau
              </span>
            </label>
            <input
              type="date"
              name="date_obtention_niveau"
              value={formData.date_obtention_niveau}
              onChange={handleChange}
              onFocus={() => handleFocus("date_obtention_niveau")}
              onBlur={handleBlur}
              disabled={isBapteme}
              className={`${inputClasses("date_obtention_niveau")} ${isBapteme ? "opacity-50 cursor-not-allowed" : ""}`}
            />
            {isBapteme && (
              <p className="mt-1 text-xs text-gray-400">
                Non applicable pour le niveau Baptême
              </p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiFileText className="w-4 h-4 text-gray-400" />
                Brevet délivré
              </span>
            </label>
            <input
              type="text"
              name="num_brevet"
              value={formData.num_brevet}
              onChange={handleChange}
              onFocus={() => handleFocus("num_brevet")}
              onBlur={handleBlur}
              disabled={isBapteme}
              className={`${inputClasses("num_brevet")} ${isBapteme ? "opacity-50 cursor-not-allowed" : ""}`}
              placeholder="FFESSM N2-2024-00123"
            />
            {isBapteme && (
              <p className="mt-1 text-xs text-gray-400">
                Non applicable pour le niveau Baptême
              </p>
            )}
          </motion.div>

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
              disabled={isBapteme}
              className={`${inputClasses("num_licence_ffesm")} ${isBapteme ? "opacity-50 cursor-not-allowed" : ""}`}
              placeholder="FF12345"
            />
            {isBapteme && (
              <p className="mt-1 text-xs text-gray-400">
                Non applicable pour le niveau Baptême
              </p>
            )}
          </motion.div>
        </div>
      </div>

      {/* Pied de page */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-end gap-3">
        <button
          type="button"
          onClick={() => navigate("/adherents")}
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
          {editMode ? "Mettre à jour" : "Créer l'adhérent"}
        </button>
      </div>
    </motion.form>
  );
};

export default AdherentForm;
