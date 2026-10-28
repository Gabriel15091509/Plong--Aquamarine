import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiUser,
  FiUserPlus,
  FiMail,
  FiPhone,
  FiCalendar,
  FiAward,
  FiSave,
  FiX,
  FiTag,
  FiClock,
  FiHash,
} from "react-icons/fi";
import { useMoniteurs } from "../../hooks/Moniteur/useMoniteurs";
import { useCloseFormModal } from "../../hooks/useFormModal";
import { useUsers } from "../../hooks/User/useUsers";
import { useAdherents } from "../../hooks/Adherent/useAdherents";
import LoadingSpinner from "../Common/LoadingSpinner";
import SearchableSelect from "../Common/SearchableSelect";
import { formatDateForInput } from "../../utils/helpers";
import { sendWelcomeEmailIfNeeded } from "../../utils/welcomeEmail";
import {
  NIVEAU_MONITEUR_OPTIONS,
  SPECIALITE_ENCADREMENT_OPTIONS,
  DISPONIBILITE_MONITEUR_OPTIONS,
} from "../../utils/constants";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

const MoniteurForm = () => {
  // Ferme la modale en revenant sur la page d'où elle a été ouverte (ex.
  // UserCreatePage) si elle vient de là, sinon sur la liste des moniteurs —
  // voir useCloseFormModal.
  const closeModal = useCloseFormModal("/moniteurs");
  const { id } = useParams();
  const editMode = !!id;

  const { useGetById, useCreate, useUpdate } = useMoniteurs();
  const { useGetAll: useGetAllUsers, useUpdateInfo } = useUsers();
  const { useGetAll: useGetAllMoniteurs } = useMoniteurs();
  const { useGetAll: useGetAllAdherents } = useAdherents();

  const { data: moniteurData, isLoading: loadingData } = useGetById(id);
  const { data: usersData, isLoading: loadingUsers } = useGetAllUsers();
  const { data: moniteursData } = useGetAllMoniteurs();
  const { data: adherentsData } = useGetAllAdherents();

  const create = useCreate();
  const update = useUpdate();
  const updateInfo = useUpdateInfo();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [focused, setFocused] = useState(null);
  const [accountMode, setAccountMode] = useState("existing"); // "existing" | "new"

  const [formData, setFormData] = useState({
    user_id: "",
    email: "",
    name: "",
    phone: "",
    niveau: "",
    num_brevet: "",
    date_obtention_brevet: "",
    specialites: [],
    disponibilites: [],
  });

  // Comptes qu'on peut lier à une nouvelle fiche moniteur : soit un compte
  // déjà de rôle "moniteur" mais sans fiche (ex. créé au préalable via
  // "Gestion des utilisateurs"), soit un adhérent ayant atteint le niveau
  // minimum pour encadrer (NIVEAU_MONITEUR_OPTIONS = "Niveau 4"/"Moniteur",
  // même barème que MoniteurService.NIVEAU_MIN_MONITEUR côté backend) — le
  // lier ici promeut directement son compte au rôle moniteur (voir
  // MoniteurService.create), sans passer par un changement de rôle à part
  // (retiré du menu ⚙️, voir AccountActionsMenu.jsx : un rôle se gagne
  // désormais via ce genre de parcours métier validé, pas un simple
  // sélecteur libre).
  const existingMoniteurUserIds = useMemo(
    () => new Set((moniteursData?.data || []).map((m) => m.user_id)),
    [moniteursData],
  );

  const availableUsers = useMemo(() => {
    const users = usersData?.data || [];
    return users.filter(
      (u) => u.role === "moniteur" && !existingMoniteurUserIds.has(u.id),
    );
  }, [usersData, existingMoniteurUserIds]);

  const eligibleAdherents = useMemo(() => {
    const usersById = new Map((usersData?.data || []).map((u) => [u.id, u]));
    return (adherentsData?.data || []).filter((a) => {
      if (!a.user_id || existingMoniteurUserIds.has(a.user_id)) return false;
      if (!NIVEAU_MONITEUR_OPTIONS.includes(a.niveau)) return false;
      // Un adhérent dont le compte a déjà un autre rôle (promu ailleurs,
      // fiche adhérent restée en historique) n'a plus sa place ici.
      return usersById.get(a.user_id)?.role === "adherent";
    });
  }, [adherentsData, usersData, existingMoniteurUserIds]);

  const linkableAccounts = useMemo(() => {
    const fromUsers = availableUsers.map((u) => ({
      id: u.id,
      label: `${u.name} - ${u.email}`,
    }));
    const fromAdherents = eligibleAdherents.map((a) => ({
      id: a.user_id,
      label: `${a.prenom} ${a.nom} - ${a.email} (Adhérent, ${a.niveau})`,
    }));
    return [...fromUsers, ...fromAdherents];
  }, [availableUsers, eligibleAdherents]);

  // Compte lié venant d'un adhérent (pas d'un simple compte "moniteur" sans
  // fiche) : son niveau/numéro de brevet/date d'obtention sont déjà des
  // informations officielles (voir Adherent.niveau/num_brevet/
  // date_obtention_niveau, tenues à jour par le passage de niveau réel) —
  // les resaisir à la main ici ouvrirait la porte à une incohérence avec
  // la fiche adhérent d'origine. `null` en édition ou hors mode "existing"
  // (le sélecteur "Lier un compte existant" n'a de sens qu'à la création).
  const linkedAdherent =
    !editMode && accountMode === "existing"
      ? eligibleAdherents.find((a) => a.user_id === formData.user_id)
      : null;

  useEffect(() => {
    if (editMode && id && moniteurData?.data) {
      const moniteur = moniteurData.data;
      const compte = usersData?.data?.find((u) => u.id === moniteur.user_id);
      setFormData((prev) => ({
        ...prev,
        user_id: moniteur.user_id || "",
        email: compte?.email || "",
        name: compte?.name || "",
        phone: compte?.phone || "",
        niveau: moniteur.niveau || "",
        num_brevet: moniteur.num_brevet || "",
        date_obtention_brevet: moniteur.date_obtention_brevet
          ? formatDateForInput(moniteur.date_obtention_brevet)
          : "",
        specialites: Array.isArray(moniteur.specialites) ? moniteur.specialites : [],
        disponibilites: Array.isArray(moniteur.disponibilites)
          ? moniteur.disponibilites
          : [],
      }));
    }
  }, [editMode, id, moniteurData, usersData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFocus = (name) => setFocused(name);
  const handleBlur = () => setFocused(null);

  const toggleSpecialite = (value) => {
    setFormData((prev) => {
      const has = prev.specialites.includes(value);
      return {
        ...prev,
        specialites: has
          ? prev.specialites.filter((s) => s !== value)
          : [...prev.specialites, value],
      };
    });
  };

  const toggleDisponibilite = (value) => {
    setFormData((prev) => {
      const has = prev.disponibilites.includes(value);
      return {
        ...prev,
        disponibilites: has
          ? prev.disponibilites.filter((d) => d !== value)
          : [...prev.disponibilites, value],
      };
    });
  };

  const validate = () => {
    const newErrors = {};
    if (!editMode) {
      if (accountMode === "existing" && !formData.user_id) {
        newErrors.user_id = "Sélectionnez un compte utilisateur";
      }
      if (accountMode === "new") {
        if (!formData.email) newErrors.email = "L'email est requis";
        if (!formData.name) newErrors.name = "Le nom est requis";
      }
    } else {
      if (!formData.email) newErrors.email = "L'email est requis";
      if (!formData.name) newErrors.name = "Le nom est requis";
    }
    if (!formData.niveau) {
      newErrors.niveau = "Le niveau est requis";
    } else if (!NIVEAU_MONITEUR_OPTIONS.includes(formData.niveau)) {
      newErrors.niveau = "Niveau 4 minimum requis pour encadrer";
    }
    if (!formData.num_brevet)
      newErrors.num_brevet = "Le numéro de brevet est requis";
    if (!formData.date_obtention_brevet)
      newErrors.date_obtention_brevet = "La date d'obtention est requise";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        niveau: formData.niveau,
        num_brevet: formData.num_brevet,
        date_obtention_brevet: formData.date_obtention_brevet,
        specialites: formData.specialites,
        disponibilites: formData.disponibilites,
      };

      if (!editMode) {
        if (accountMode === "existing") {
          payload.user_id = formData.user_id;
        } else {
          payload.email = formData.email;
          payload.name = formData.name;
          payload.phone = formData.phone;
        }
      }

      if (editMode && id) {
        await update.mutateAsync({ id, data: payload });
        // Informations du compte lié (email/nom/téléphone) — distinctes de
        // la fiche moniteur elle-même, voir UserController.updateUserInfo.
        if (formData.user_id) {
          await updateInfo.mutateAsync({
            id: formData.user_id,
            data: {
              name: formData.name,
              email: formData.email,
              phone: formData.phone,
            },
          });
        }
      } else {
        const result = await create.mutateAsync(payload);
        await sendWelcomeEmailIfNeeded(result);
      }
      closeModal();
    } catch (error) {
      console.error("Échec de l'enregistrement du moniteur :", error);
    } finally {
      setLoading(false);
    }
  };

  if (editMode && loadingData) return <LoadingSpinner variant="form" />;
  if (loadingUsers) return <LoadingSpinner variant="form" />;

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
        {!editMode && (
          <motion.div {...fadeInUp} className="space-y-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAccountMode("existing")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
                  accountMode === "existing"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-gray-400"
                }`}
              >
                <FiUser className="w-4 h-4" />
                Lier un compte existant
              </button>
              <button
                type="button"
                onClick={() => setAccountMode("new")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
                  accountMode === "new"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-gray-400"
                }`}
              >
                <FiUserPlus className="w-4 h-4" />
                Créer un nouveau compte
              </button>
            </div>

            {accountMode === "existing" ? (
              <SearchableSelect
                label="Compte utilisateur (rôle moniteur, ou adhérent Niveau 4+) *"
                value={formData.user_id}
                onChange={(value) => {
                  // Sélectionner un adhérent renseigne directement niveau/
                  // n° brevet/date d'obtention depuis sa fiche (verrouillés
                  // ensuite, voir linkedAdherent) ; choisir un simple compte
                  // "moniteur" sans fiche vide ces 3 champs pour ressaisie
                  // manuelle (pas de source fiable à reprendre pour eux).
                  const adherent = eligibleAdherents.find(
                    (a) => a.user_id === value,
                  );
                  setFormData((prev) => ({
                    ...prev,
                    user_id: value,
                    niveau: adherent ? adherent.niveau : "",
                    num_brevet: adherent ? adherent.num_brevet || "" : "",
                    date_obtention_brevet:
                      adherent && adherent.date_obtention_niveau
                        ? formatDateForInput(adherent.date_obtention_niveau)
                        : "",
                  }));
                  setErrors((prev) => ({
                    ...prev,
                    user_id: "",
                    niveau: "",
                    num_brevet: "",
                    date_obtention_brevet: "",
                  }));
                }}
                options={linkableAccounts}
                getOptionLabel={(o) => o.label}
                getOptionValue={(o) => o.id}
                placeholder="Rechercher un utilisateur ou un adhérent..."
                error={errors.user_id}
                required={true}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
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
                    placeholder="moniteur@club.fr"
                  />
                  {errors.email && (
                    <p className="mt-1.5 text-sm text-red-500">{errors.email}</p>
                  )}
                </div>
                <div>
                  <label className={labelClasses}>
                    <span className="flex items-center gap-2">
                      <FiUser className="w-4 h-4 text-gray-400" />
                      Nom complet *
                    </span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    onFocus={() => handleFocus("name")}
                    onBlur={handleBlur}
                    className={inputClasses("name")}
                    placeholder="Jean Dupont"
                  />
                  {errors.name && (
                    <p className="mt-1.5 text-sm text-red-500">{errors.name}</p>
                  )}
                </div>
                <div>
                  <label className={labelClasses}>
                    <span className="flex items-center gap-2">
                      <FiPhone className="w-4 h-4 text-gray-400" />
                      Téléphone
                    </span>
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    onFocus={() => handleFocus("phone")}
                    onBlur={handleBlur}
                    className={inputClasses("phone")}
                    placeholder="06 12 34 56 78"
                  />
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* En édition, le compte est déjà lié (formData.user_id) — ces
            champs remplacent le sélecteur "Lier un compte existant" /
            "Créer un nouveau compte" ci-dessus, qui n'a de sens qu'à la
            création. Sans ça, impossible de corriger l'email/le nom/le
            téléphone d'un moniteur une fois sa fiche créée (voir
            AccountManagementCard.jsx pour le reste de la gestion de
            compte — statut/mot de passe/rôle/suppression). */}
        {editMode && (
          <motion.div {...fadeInUp} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
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
                placeholder="moniteur@club.fr"
              />
              {errors.email && (
                <p className="mt-1.5 text-sm text-red-500">{errors.email}</p>
              )}
            </div>
            <div>
              <label className={labelClasses}>
                <span className="flex items-center gap-2">
                  <FiUser className="w-4 h-4 text-gray-400" />
                  Nom complet *
                </span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onFocus={() => handleFocus("name")}
                onBlur={handleBlur}
                className={inputClasses("name")}
                placeholder="Jean Dupont"
              />
              {errors.name && (
                <p className="mt-1.5 text-sm text-red-500">{errors.name}</p>
              )}
            </div>
            <div>
              <label className={labelClasses}>
                <span className="flex items-center gap-2">
                  <FiPhone className="w-4 h-4 text-gray-400" />
                  Téléphone
                </span>
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                onFocus={() => handleFocus("phone")}
                onBlur={handleBlur}
                className={inputClasses("phone")}
                placeholder="06 12 34 56 78"
              />
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {linkedAdherent && (
            <motion.p
              {...fadeInUp}
              className="md:col-span-2 -mb-1 text-xs text-gray-500 dark:text-gray-400"
            >
              Niveau, n° de brevet et date d&apos;obtention repris de la
              fiche adhérent de {linkedAdherent.prenom}{" "}
              {linkedAdherent.nom} — non modifiables ici (voir sa fiche
              pour les corriger).
            </motion.p>
          )}
          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiAward className="w-4 h-4 text-gray-400" />
                Niveau *
              </span>
            </label>
            <select
              name="niveau"
              value={formData.niveau}
              onChange={handleChange}
              onFocus={() => handleFocus("niveau")}
              onBlur={handleBlur}
              disabled={!!linkedAdherent}
              className={`${inputClasses("niveau")} ${linkedAdherent ? "bg-gray-100 dark:bg-gray-700/50 cursor-not-allowed text-gray-500 dark:text-gray-400" : ""}`}
            >
              <option value="">Sélectionner...</option>
              {NIVEAU_MONITEUR_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            {errors.niveau && (
              <p className="mt-1.5 text-sm text-red-500">{errors.niveau}</p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiHash className="w-4 h-4 text-gray-400" />
                N° Brevet *
              </span>
            </label>
            <input
              type="text"
              name="num_brevet"
              value={formData.num_brevet}
              onChange={handleChange}
              onFocus={() => handleFocus("num_brevet")}
              onBlur={handleBlur}
              readOnly={!!linkedAdherent}
              className={`${inputClasses("num_brevet")} ${linkedAdherent ? "bg-gray-100 dark:bg-gray-700/50 cursor-not-allowed text-gray-500 dark:text-gray-400" : ""}`}
              placeholder="MF1-2024-001"
            />
            {errors.num_brevet && (
              <p className="mt-1.5 text-sm text-red-500">
                {errors.num_brevet}
              </p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiCalendar className="w-4 h-4 text-gray-400" />
                Date d'obtention du brevet *
              </span>
            </label>
            <input
              type="date"
              name="date_obtention_brevet"
              value={formData.date_obtention_brevet}
              onChange={handleChange}
              onFocus={() => handleFocus("date_obtention_brevet")}
              onBlur={handleBlur}
              // disabled plutôt que readOnly : un <input type="date"> en
              // readOnly bloque bien la saisie clavier mais pas toujours le
              // sélecteur natif (flèches/calendrier) selon le navigateur —
              // disabled coupe l'interaction de façon fiable partout.
              disabled={!!linkedAdherent}
              className={`${inputClasses("date_obtention_brevet")} ${linkedAdherent ? "bg-gray-100 dark:bg-gray-700/50 cursor-not-allowed text-gray-500 dark:text-gray-400" : ""}`}
            />
            {errors.date_obtention_brevet && (
              <p className="mt-1.5 text-sm text-red-500">
                {errors.date_obtention_brevet}
              </p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiTag className="w-4 h-4 text-gray-400" />
                Spécialités d&apos;encadrement
              </span>
            </label>
            <div className="flex flex-wrap gap-3 pt-1">
              {SPECIALITE_ENCADREMENT_OPTIONS.map((opt) => (
                <label
                  key={opt}
                  className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.specialites.includes(opt)}
                    onChange={() => toggleSpecialite(opt)}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  {opt}
                </label>
              ))}
            </div>
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiClock className="w-4 h-4 text-gray-400" />
                Disponibilités
              </span>
            </label>
            <div className="flex flex-wrap gap-3 pt-1">
              {DISPONIBILITE_MONITEUR_OPTIONS.map((opt) => (
                <label
                  key={opt}
                  className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.disponibilites.includes(opt)}
                    onChange={() => toggleDisponibilite(opt)}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  {opt}
                </label>
              ))}
            </div>
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
          {editMode ? "Mettre à jour" : "Créer le moniteur"}
        </button>
      </div>
    </form>
  );
};

export default MoniteurForm;
