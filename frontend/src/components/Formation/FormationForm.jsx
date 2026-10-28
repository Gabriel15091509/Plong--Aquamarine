import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiAward,
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiList,
  FiFileText,
  FiSave,
  FiX,
  FiDollarSign,
  FiCreditCard,
} from "react-icons/fi";
import { useFormations } from "../../hooks/Formation/useFormations";
import { useSeances } from "../../hooks/Formation/useSeances";
import { useCloseFormModal } from "../../hooks/useFormModal";
import { useAdherents } from "../../hooks/Adherent/useAdherents";
import { useMoniteurs } from "../../hooks/Moniteur/useMoniteurs";
import LoadingSpinner from "../Common/LoadingSpinner";
import SearchableSelect from "../Common/SearchableSelect";
import {
  NIVEAU_FORMATION_OPTIONS,
  NIVEAU_VISE_SUIVANT,
  STATUT_FORMATION_OPTIONS,
  MODE_PAIEMENT_OPTIONS,
  APPRECIATION_MONITEUR_OPTIONS,
  STATUTS_ADHERENT_EXCLUS_SELECTION,
} from "../../utils/constants";
import { computeNoteMoyenneSeances, suggestAppreciationMoniteur } from "../../utils/helpers";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

const FormationForm = () => {
  // Ferme la modale en revenant sur la page d'où elle a été ouverte si elle
  // vient de là, sinon sur la liste des formations — voir useCloseFormModal.
  const closeModal = useCloseFormModal("/formations");
  const { id } = useParams();
  const editMode = !!id;

  const { useGetById, useCreate, useUpdate } = useFormations();
  const { useGetAll } = useAdherents();
  const { useGetAll: useGetAllMoniteurs } = useMoniteurs();
  const { useGetByFormation: useGetSeancesByFormation } = useSeances();

  const { data, isLoading: loadingData } = useGetById(id);
  const { data: adherentsData, isLoading: loadingAdherents } = useGetAll();
  const { data: moniteursData, isLoading: loadingMoniteurs } = useGetAllMoniteurs();
  // Uniquement pour suggérer une appréciation (voir l'effet plus bas) : pas
  // besoin en création, une formation qui vient de naître n'a pas encore de
  // séance.
  const { data: seancesData } = useGetSeancesByFormation(editMode ? id : undefined);

  const create = useCreate();
  const update = useUpdate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [focused, setFocused] = useState(null);
  const submittingRef = useRef(false);
  // Même principe que profondeurMaxTouchedRef dans SortieForm.jsx :
  // "Niveau visé" est auto-rempli au niveau juste supérieur à celui de
  // l'adhérent choisi (NIVEAU_VISE_SUIVANT) tant que le staff n'a pas
  // modifié ce champ à la main — dès qu'il le touche directement, on arrête
  // de le réécrire si l'adhérent change ensuite.
  const niveauViseTouchedRef = useRef(false);
  // Même principe que niveauViseTouchedRef : la suggestion d'appréciation
  // (voir l'effet plus bas) ne pré-remplit le select QUE tant que le
  // moniteur n'a jamais lui-même choisi de valeur pour cette formation —
  // dès qu'il en choisit une (même pour revenir sur la suggestion), elle
  // arrête de s'imposer si la moyenne recalcule ensuite (ex. une note
  // corrigée après coup).
  const appreciationTouchedRef = useRef(false);

  const [formData, setFormData] = useState({
    num_adherent: "",
    id_moniteur: "",
    niveau_vise: "N1",
    date_debut: "",
    date_fin_prevue: "",
    date_examen_brevet: "",
    statut: "En cours",
    nb_seances_realisees: 0,
    nb_seances_prevues: "",
    commentaire_moniteur: "",
    appreciation_moniteur: "",
    montant_total: "",
    montant_paye: "",
    mode: "Espèces",
  });

  // Un adhérent "Ancien"/"Suspendu" ne doit plus pouvoir être choisi pour
  // une NOUVELLE formation (voir STATUTS_ADHERENT_EXCLUS_SELECTION). En
  // édition, l'adhérent déjà lié à la formation reste affiché même si son
  // statut est désormais exclu, pour ne pas casser l'affichage existant.
  const adherentOptions = useMemo(() => {
    const all = adherentsData?.data || [];
    const eligibles = all.filter(
      (a) => !STATUTS_ADHERENT_EXCLUS_SELECTION.includes(a.statut),
    );
    if (
      formData.num_adherent &&
      !eligibles.some((a) => a.num_adherent === formData.num_adherent)
    ) {
      const actuel = all.find((a) => a.num_adherent === formData.num_adherent);
      if (actuel) return [actuel, ...eligibles];
    }
    return eligibles;
  }, [adherentsData, formData.num_adherent]);

  useEffect(() => {
    if (editMode && id && data?.data) {
      const f = data.data;
      // Une formation existante a déjà son propre niveau visé (voulu par le
      // staff à l'époque, potentiellement différent du "niveau suivant"
      // théorique) : ne jamais l'écraser via l'auto-calcul en édition.
      niveauViseTouchedRef.current = true;
      // Une appréciation déjà enregistrée est un choix du moniteur qu'il ne
      // faut plus jamais recouvrir par la suggestion (voir l'effet plus bas).
      if (f.appreciation_moniteur) appreciationTouchedRef.current = true;
      setFormData({
        num_adherent: f.num_adherent || "",
        id_moniteur: f.id_moniteur || "",
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
        nb_seances_prevues: f.nb_seances_prevues ?? "",
        commentaire_moniteur: f.commentaire_moniteur || "",
        appreciation_moniteur: f.appreciation_moniteur || "",
        montant_total: f.montant_total ?? "",
        montant_paye: f.montant_paye ?? "",
        mode: "Espèces",
      });
    }
  }, [editMode, id, data]);

  // Moyenne des séances déjà notées (voir FormationSeances.jsx) : une fois
  // toutes les séances prévues réalisées, suggère une appréciation à partir
  // de seuils indicatifs (SEUILS_APPRECIATION_MONITEUR) — jamais avant, le
  // "résultat" ne doit s'afficher qu'à la fin de toutes les séances. Pure
  // proposition : le moniteur choisit toujours librement, y compris une
  // valeur différente.
  const noteMoyenne = useMemo(
    () => computeNoteMoyenneSeances(seancesData?.data || []),
    [seancesData],
  );
  const toutesSeancesFaites =
    !!formData.nb_seances_prevues &&
    Number(formData.nb_seances_realisees) >= Number(formData.nb_seances_prevues);
  const appreciationSuggeree =
    toutesSeancesFaites && noteMoyenne !== null
      ? suggestAppreciationMoniteur(noteMoyenne)
      : null;

  useEffect(() => {
    if (
      appreciationSuggeree &&
      !appreciationTouchedRef.current &&
      !formData.appreciation_moniteur
    ) {
      setFormData((prev) => ({ ...prev, appreciation_moniteur: appreciationSuggeree }));
    }
    // formData.appreciation_moniteur volontairement absent des deps : cet
    // effet ne doit réagir qu'à l'arrivée de la suggestion elle-même, pas se
    // redéclencher à chaque frappe dans le reste du formulaire.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appreciationSuggeree]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "niveau_vise") {
      // Modification manuelle explicite : ne plus jamais auto-recalculer ce
      // champ pour ce formulaire, même si l'adhérent change ensuite.
      niveauViseTouchedRef.current = true;
    }
    if (name === "appreciation_moniteur") {
      appreciationTouchedRef.current = true;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFocus = (name) => setFocused(name);
  const handleBlur = () => setFocused(null);

  const validate = () => {
    const newErrors = {};
    if (!formData.num_adherent)
      newErrors.num_adherent = "L'adhérent est requis";
    if (!formData.id_moniteur)
      newErrors.id_moniteur = "Le moniteur responsable est requis";
    if (!formData.niveau_vise) newErrors.niveau_vise = "Le niveau est requis";
    if (!formData.date_debut)
      newErrors.date_debut = "La date de début est requise";
    if (!formData.date_fin_prevue)
      newErrors.date_fin_prevue = "La date de fin prévue est requise";
    if (!formData.nb_seances_prevues || Number(formData.nb_seances_prevues) <= 0)
      newErrors.nb_seances_prevues = "Le nombre de séances prévues est requis";
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
      closeModal();
    } catch (error) {
      console.error("Échec de l'enregistrement de la formation :", error);
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  if (editMode && loadingData) return <LoadingSpinner variant="form" />;
  if (loadingAdherents || loadingMoniteurs) return <LoadingSpinner variant="form" />;

  const moniteurOptions = (moniteursData?.data || []).map((m) => ({
    ...m,
    label: m.user?.name || `Moniteur #${m.id_moniteur}`,
  }));

  // Sert uniquement à l'indication sous "Niveau visé" ci-dessous (niveau
  // actuel de l'adhérent choisi) — le pré-remplissage lui-même se fait dans
  // le onChange de "Adhérent" plus haut.
  const selectedAdherent = (adherentsData?.data || []).find(
    (a) => a.num_adherent === formData.num_adherent,
  );

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
                // Pré-remplit "Niveau visé" au niveau juste supérieur à
                // celui de l'adhérent (NIVEAU_VISE_SUIVANT) tant que le
                // staff n'a pas modifié ce champ à la main — voir
                // niveauViseTouchedRef/handleChange. Un Moniteur n'a pas de
                // "niveau supérieur" prévu : le champ garde alors sa valeur
                // actuelle, à choisir manuellement.
                const adherent = (adherentsData?.data || []).find(
                  (a) => a.num_adherent === value,
                );
                const niveauSuivant =
                  adherent && NIVEAU_VISE_SUIVANT[adherent.niveau];
                setFormData((prev) => ({
                  ...prev,
                  num_adherent: value,
                  niveau_vise:
                    !niveauViseTouchedRef.current && niveauSuivant
                      ? niveauSuivant
                      : prev.niveau_vise,
                }));
                if (errors.num_adherent)
                  setErrors((prev) => ({ ...prev, num_adherent: "" }));
              }}
              options={adherentOptions}
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
            <SearchableSelect
              label="Moniteur responsable *"
              value={formData.id_moniteur}
              onChange={(value) => {
                setFormData((prev) => ({ ...prev, id_moniteur: value }));
                if (errors.id_moniteur)
                  setErrors((prev) => ({ ...prev, id_moniteur: "" }));
              }}
              options={moniteurOptions}
              getOptionLabel={(m) => m.label}
              getOptionValue={(m) => m.id_moniteur}
              placeholder="Rechercher un moniteur..."
              error={errors.id_moniteur}
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
            {selectedAdherent && NIVEAU_VISE_SUIVANT[selectedAdherent.niveau] && (
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                Pré-rempli selon le niveau actuel de l&apos;adhérent (
                {selectedAdherent.niveau}) — modifiable si besoin.
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
              {/* "Terminée" ne se sélectionne pas ici : seule l'action
                  dédiée "Terminer la formation" (bouton de la liste/fiche)
                  y mène, car elle seule vérifie les séances/compétences
                  requises et promeut l'adhérent — le serveur rejette de
                  toute façon ce passage via cette route générique (voir
                  FormationService.update). Reste affichée si c'est déjà
                  le statut courant, pour ne pas casser l'affichage d'une
                  formation déjà terminée. */}
              {STATUT_FORMATION_OPTIONS.filter(
                (opt) => opt !== "Terminée" || formData.statut === "Terminée",
              ).map((opt) => (
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
                  Si le statut reste « En cours », un premier versement (même partiel) est
                  requis pour créer la formation. Choisissez « Suspendue » si aucun paiement
                  n'est encore reçu.
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
                Nombre de séances prévues *
              </span>
            </label>
            <input
              type="number"
              name="nb_seances_prevues"
              value={formData.nb_seances_prevues}
              onChange={handleChange}
              onFocus={() => handleFocus("nb_seances_prevues")}
              onBlur={handleBlur}
              className={inputClasses("nb_seances_prevues")}
              min="1"
              placeholder="Ex : 10"
            />
            {errors.nb_seances_prevues && (
              <p className="mt-1.5 text-sm text-red-500">
                {errors.nb_seances_prevues}
              </p>
            )}
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              Une fois ce nombre atteint et toutes les compétences validées, la
              formation se termine automatiquement et le niveau est attribué.
            </p>
          </motion.div>

          {editMode && (
            <motion.div {...fadeInUp}>
              <label className={labelClasses}>
                <span className="flex items-center gap-2">
                  <FiList className="w-4 h-4 text-gray-400" />
                  Séances réalisées
                </span>
              </label>
              {/* Lecture seule : ce compteur ne doit refléter que les
                  séances réellement pointées "Réalisée" (voir
                  FormationSeances.jsx) — une saisie libre ici le
                  déconnectait des vraies séances et faussait la
                  progression affichée. */}
              <p className="w-full px-4 py-2.5 text-sm border rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400">
                {formData.nb_seances_realisees}
                {formData.nb_seances_prevues ? `/${formData.nb_seances_prevues}` : ""} — mis à jour
                automatiquement lors du pointage des séances
              </p>
            </motion.div>
          )}

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiCheckCircle className="w-4 h-4 text-gray-400" />
                Appréciation du moniteur
              </span>
            </label>
            <select
              name="appreciation_moniteur"
              value={formData.appreciation_moniteur}
              onChange={handleChange}
              onFocus={() => handleFocus("appreciation_moniteur")}
              onBlur={handleBlur}
              className={inputClasses("appreciation_moniteur")}
            >
              <option value="">Non évaluée</option>
              {APPRECIATION_MONITEUR_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            {noteMoyenne !== null && (
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                Moyenne des séances notées : {noteMoyenne.toFixed(1)}/20
                {appreciationSuggeree && ` — suggestion : ${appreciationSuggeree}`}
                {!toutesSeancesFaites &&
                  " (toutes les séances prévues ne sont pas encore réalisées)"}
              </p>
            )}
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
          {editMode ? "Mettre à jour" : "Créer la formation"}
        </button>
      </div>
    </form>
  );
};

export default FormationForm;
