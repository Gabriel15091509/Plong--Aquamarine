import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiCalendar,
  FiMapPin,
  FiMap,
  FiTag,
  FiAward,
  FiUsers,
  FiDroplet,
  FiClock,
  FiSave,
  FiX,
  FiFileText,
  FiClipboard,
  FiInfo,
  FiDollarSign,
  FiAlertTriangle,
  FiUserCheck,
} from "react-icons/fi";
import { useSorties } from "../../hooks/Sortie/useSorties";
import { useMoniteurs } from "../../hooks/Moniteur/useMoniteurs";
import { useCloseFormModal } from "../../hooks/useFormModal";
import LoadingSpinner from "../Common/LoadingSpinner";
import SortieLocationPicker from "./SortieLocationPicker";
import LieuAutocompleteInput from "./LieuAutocompleteInput";
import {
  TYPE_SORTIE_OPTIONS,
  STATUT_SORTIE_OPTIONS,
  STATUT_SORTIE,
  NIVEAU_OPTIONS,
  PROFONDEUR_MAX_PAR_NIVEAU,
} from "../../utils/constants";
import {
  formatDateForInput,
  formatDateTimeForInput,
  formatDateTime,
  isTypeNiveauCompatible,
} from "../../utils/helpers";

// Détection de chevauchement d'horaires, même sémantique que
// sortieOverlap.js côté backend (intervalle semi-ouvert [date_heure,
// date_heure + duree_estimee[) — dupliquée ici faute de code partagé entre
// front et back : sert à repérer, parmi les moniteurs, ceux déjà désignés
// encadrants d'une AUTRE sortie dont le créneau chevauche celui en cours de
// saisie, pour ne pas laisser le président les désigner en double sans s'en
// rendre compte.
function dureeEnMs(duree_estimee) {
  if (!duree_estimee) return 0;
  const [h = 0, m = 0, s = 0] = String(duree_estimee).split(":").map(Number);
  return ((h * 60 + m) * 60 + s) * 1000;
}

function getSortieInterval(sortie) {
  const debut = new Date(sortie.date_heure).getTime();
  return { debut, fin: debut + dureeEnMs(sortie.duree_estimee) };
}

function sortiesSeChevauchent(sortieA, sortieB) {
  const a = getSortieInterval(sortieA);
  const b = getSortieInterval(sortieB);
  if (Number.isNaN(a.debut) || Number.isNaN(b.debut)) return false;
  return a.debut < b.fin && b.debut < a.fin;
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

// Jours de sortie habituels du club (voir page À propos "Infos
// pratiques") : dimanche(0), mercredi(3), samedi(6) — getDay(). Un autre
// jour reste possible (météo, sortie exceptionnelle...), donc un simple
// avertissement non bloquant plutôt qu'une erreur de validation.
const JOURS_SORTIE_HABITUELS = [0, 3, 6];

const isJourSortieInhabituel = (dateHeure) => {
  if (!dateHeure) return false;
  const jour = new Date(dateHeure).getDay();
  return !Number.isNaN(jour) && !JOURS_SORTIE_HABITUELS.includes(jour);
};

const SortieForm = () => {
  // Ferme la modale en revenant sur la page d'où elle a été ouverte si elle
  // vient de là, sinon sur la liste des sorties — voir useCloseFormModal.
  const closeModal = useCloseFormModal("/sorties");
  const { id } = useParams();
  const editMode = !!id;

  const { useGetAll: useGetAllSorties, useGetById, useCreate, useUpdate } =
    useSorties();
  const { data, isLoading: loadingData } = useGetById(id);
  const create = useCreate();
  const update = useUpdate();
  // Moniteurs enregistrés (identite-service) parmi lesquels désigner les
  // encadrants de cette sortie — voir Sortie.encadrants (backend). Distinct
  // de l'encadrant par palanquée (choisi plus tard, une fois les
  // palanquées constituées, voir PalanqueesManager).
  const { useGetAll: useGetAllMoniteurs } = useMoniteurs();
  const { data: moniteursData, isLoading: loadingMoniteurs } =
    useGetAllMoniteurs();
  const moniteurs = moniteursData?.data || [];
  // Toutes les sorties existantes, pour repérer les moniteurs déjà occupés
  // (voir moniteursIndisponibles ci-dessous) sur le créneau en cours de
  // saisie — pas de endpoint dédié "disponibilité", ce calcul se fait donc
  // côté client à partir de la liste complète (déjà chargée sans pagination
  // par SortieController.getAll).
  const { data: sortiesData } = useGetAllSorties();
  const autresSorties = useMemo(() => sortiesData?.data || [], [sortiesData]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [focused, setFocused] = useState(null);
  // RG6 : les inscriptions s'ouvrent 7 jours avant la sortie — pré-rempli
  // automatiquement à partir de la date/heure tant que le staff n'a pas
  // lui-même modifié ce champ (cas particulier : ouverture anticipée/tardive
  // volontaire), pour que la règle soit respectée par défaut plutôt que de
  // dépendre d'un calcul manuel à chaque création.
  const dateOuvertureTouchedRef = useRef(false);
  // Même principe que dateOuvertureTouchedRef ci-dessus, pour
  // profondeur_max : auto-rempli à partir de PROFONDEUR_MAX_PAR_NIVEAU tant
  // que le staff n'a pas modifié le champ à la main (voir handleChange).
  const profondeurMaxTouchedRef = useRef(false);
  // Même principe encore, pour les tarifs : une sortie "Nettoyage" est par
  // convention gratuite (aucune règle serveur ne l'impose, voir
  // tarifRules.computeMontantDu), donc on le suggère par défaut dès que ce
  // type est choisi — sans écraser une saisie déjà faite à la main.
  const tarifsTouchedRef = useRef(false);

  const [formData, setFormData] = useState({
    date_heure: "",
    lieu: "",
    site: "",
    type: "Plongée d'exploration",
    // Compatible avec le type par défaut ci-dessus (voir
    // NIVEAU_MIN_PAR_TYPE_SORTIE : "Plongée d'exploration" exige au moins
    // "Niveau 1", "Baptême" n'y serait pas proposé par le select filtré).
    niveau_requis: "Niveau 1",
    nb_places: 10,
    profondeur_max: PROFONDEUR_MAX_PAR_NIVEAU["Niveau 1"],
    duree_estimee: "01:00",
    statut: "Planifiée",
    description_site: "",
    // Pré-rempli à aujourd'hui dès l'ouverture du formulaire de création
    // (plutôt que vide) : tant que la date/heure de la sortie n'est pas
    // encore choisie, le calcul à J-7 n'a rien à calculer, mais laisser le
    // champ vide donnait l'impression que "le pré-remplissage" annoncé par
    // l'indication sous le champ ne marchait pas. Dès que la date/heure est
    // saisie, la logique de handleChange ci-dessous recalcule cette valeur
    // à J-7 (sauf si le staff a déjà modifié ce champ à la main).
    date_ouverture_inscriptions: formatDateForInput(new Date()),
    condition_affectation: "",
    tarif_adherent: 0,
    // 0 par défaut, comme tarif_adherent (0 = gratuit) — à la création
    // uniquement : en modification (voir l'useEffect ci-dessous), une
    // sortie existante dont ce champ est vide (null en base) garde ce vide,
    // pour ne pas basculer silencieusement un invité de "même tarif que
    // l'adhérent" (repli serveur, voir tarifRules.computeMontantDu) à
    // "gratuit" au premier enregistrement suivant une modification.
    tarif_non_adherent: 0,
    latitude: "",
    longitude: "",
    encadrants: [],
  });

  useEffect(() => {
    if (editMode && id && data?.data) {
      const s = data.data;
      // Une sortie existante a déjà sa propre date d'ouverture (voulue par
      // le staff à l'époque) : ne jamais l'écraser via l'auto-calcul si la
      // date/heure est retouchée en édition.
      dateOuvertureTouchedRef.current = true;
      // Une sortie existante a déjà sa propre profondeur_max (voulue par le
      // staff, potentiellement inférieure au max théorique du niveau pour
      // ce site précis) : ne jamais l'écraser via l'auto-calcul en édition.
      profondeurMaxTouchedRef.current = true;
      // Idem pour les tarifs : une sortie existante a déjà ses propres
      // tarifs (même un "Nettoyage" facturé exceptionnellement) — ne jamais
      // les écraser via la suggestion automatique en édition.
      tarifsTouchedRef.current = true;
      setFormData({
        date_heure: formatDateTimeForInput(s.date_heure),
        lieu: s.lieu || "",
        site: s.site || "",
        type: s.type || "Plongée d'exploration",
        niveau_requis: s.niveau_requis || "Débutant",
        nb_places: s.nb_places || 10,
        profondeur_max:
          s.profondeur_max ||
          PROFONDEUR_MAX_PAR_NIVEAU[s.niveau_requis] ||
          20,
        duree_estimee: s.duree_estimee || "01:00",
        statut: s.statut || "Planifiée",
        description_site: s.description_site || "",
        date_ouverture_inscriptions: formatDateForInput(
          s.date_ouverture_inscriptions,
        ),
        condition_affectation: s.condition_affectation || "",
        tarif_adherent: s.tarif_adherent ?? 0,
        // Volontairement `?? ""` et non `?? 0` (contrairement au défaut de
        // création ci-dessus) : une sortie existante avec ce champ non
        // renseigné (null) applique le tarif adhérent aux invités (repli
        // serveur) — si on affichait 0 ici, enregistrer la moindre autre
        // modification de cette sortie la rendrait gratuite pour eux sans
        // que le staff l'ait décidé.
        tarif_non_adherent: s.tarif_non_adherent ?? "",
        latitude: s.latitude ?? "",
        longitude: s.longitude ?? "",
        encadrants: Array.isArray(s.encadrants) ? s.encadrants : [],
      });
    }
  }, [editMode, id, data]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "date_ouverture_inscriptions") {
      // Modification manuelle explicite : ne plus jamais auto-recalculer
      // ce champ pour ce formulaire, même si date_heure change ensuite.
      dateOuvertureTouchedRef.current = true;
    }
    if (name === "profondeur_max") {
      // Idem : dès que le staff touche directement ce champ, on arrête de
      // le réécrire quand "Niveau requis" change ensuite (le staff a
      // délibérément choisi une profondeur différente du max théorique).
      profondeurMaxTouchedRef.current = true;
    }
    if (name === "tarif_adherent" || name === "tarif_non_adherent") {
      // Le staff a lui-même choisi un tarif (y compris pour un
      // "Nettoyage" exceptionnellement facturé) : ne plus jamais le
      // réécrire automatiquement ensuite.
      tarifsTouchedRef.current = true;
    }

    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "date_heure" && value && !dateOuvertureTouchedRef.current) {
        const ouverture = new Date(value);
        if (!Number.isNaN(ouverture.getTime())) {
          ouverture.setDate(ouverture.getDate() - 7);
          next.date_ouverture_inscriptions = formatDateForInput(ouverture);
        }
      }
      if (
        name === "niveau_requis" &&
        !profondeurMaxTouchedRef.current &&
        PROFONDEUR_MAX_PAR_NIVEAU[value] != null
      ) {
        next.profondeur_max = PROFONDEUR_MAX_PAR_NIVEAU[value];
      }
      // "Nettoyage" est par convention gratuit (voir tarifsTouchedRef
      // ci-dessus) : suggestion, pas un verrou — les champs restent
      // modifiables juste après si le club veut exceptionnellement facturer.
      if (name === "type" && value === "Nettoyage" && !tarifsTouchedRef.current) {
        next.tarif_adherent = 0;
        next.tarif_non_adherent = 0;
      }
      // Un type n'est pas compatible avec n'importe quel niveau requis (ex.
      // "Plongée technique" exige un minimum d'autonomie, "Baptême" est
      // réservé aux non-plongeurs — voir isTypeNiveauCompatible/
      // NIVEAU_MIN_PAR_TYPE_SORTIE). Le select "Niveau requis" ci-dessous ne
      // propose déjà que les valeurs compatibles, mais un niveau requis
      // choisi AVANT de changer le type peut devenir incompatible : recalé
      // ici sur le minimum compatible du nouveau type, plutôt que de laisser
      // une valeur qui ne serait de toute façon plus dans le select.
      if (name === "type" && !isTypeNiveauCompatible(value, next.niveau_requis)) {
        next.niveau_requis =
          NIVEAU_OPTIONS.find((n) => isTypeNiveauCompatible(value, n)) || next.niveau_requis;
        if (
          !profondeurMaxTouchedRef.current &&
          PROFONDEUR_MAX_PAR_NIVEAU[next.niveau_requis] != null
        ) {
          next.profondeur_max = PROFONDEUR_MAX_PAR_NIVEAU[next.niveau_requis];
        }
      }
      return next;
    });
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFocus = (name) => setFocused(name);
  const handleBlur = () => setFocused(null);

  const handleLocationChange = (lat, lng) =>
    setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }));

  const handleAddressResolved = ({ lieu, site }) =>
    setFormData((prev) => ({
      ...prev,
      lieu: lieu || prev.lieu,
      site: site || prev.site,
    }));

  // Symétrique de handleAddressResolved (carte → champs) : ici l'utilisateur
  // choisit une suggestion issue de la saisie du champ "Lieu", donc c'est le
  // texte qui pilote la carte — on repositionne le point et on complète
  // "Site" si Nominatim en propose un, sans écraser un site déjà saisi à la
  // main s'il n'en renvoie pas.
  const handleLieuSelected = (result) => {
    setFormData((prev) => ({
      ...prev,
      lieu: result.lieu || prev.lieu,
      site: result.site || prev.site,
      latitude: Math.round(result.lat * 1e6) / 1e6,
      longitude: Math.round(result.lng * 1e6) / 1e6,
    }));
    setErrors((prev) => ({ ...prev, lieu: "", latitude: "" }));
  };

  const toggleEncadrant = (idMoniteur) => {
    setFormData((prev) => {
      const has = prev.encadrants.includes(idMoniteur);
      return {
        ...prev,
        encadrants: has
          ? prev.encadrants.filter((id) => id !== idMoniteur)
          : [...prev.encadrants, idMoniteur],
      };
    });
  };

  // id_moniteur -> sortie en conflit, pour chaque moniteur déjà désigné
  // encadrant d'une autre sortie (statut différent d'"Annulée" : une sortie
  // annulée ne mobilise plus personne) dont le créneau chevauche celui
  // choisi ici. Exclut la sortie elle-même en modification, sinon toute
  // édition d'une sortie déjà planifiée grisait ses propres encadrants.
  // Vide tant que date_heure n'est pas encore renseignée : rien à comparer.
  const moniteursIndisponibles = useMemo(() => {
    const map = new Map();
    if (!formData.date_heure) return map;
    const candidate = {
      date_heure: formData.date_heure,
      duree_estimee: formData.duree_estimee,
    };
    for (const autre of autresSorties) {
      if (editMode && String(autre.id_sortie) === String(id)) continue;
      if (autre.statut === STATUT_SORTIE.ANNULEE) continue;
      if (!Array.isArray(autre.encadrants) || autre.encadrants.length === 0) continue;
      if (!sortiesSeChevauchent(candidate, autre)) continue;
      for (const idMoniteur of autre.encadrants) {
        if (!map.has(idMoniteur)) map.set(idMoniteur, autre);
      }
    }
    return map;
  }, [autresSorties, formData.date_heure, formData.duree_estimee, editMode, id]);

  // id_moniteur -> motif, pour chaque moniteur qui s'est déclaré (ou a été
  // déclaré par le président) indisponible pour encadrer (voir
  // MoniteurAvailabilityToggle.jsx) — distinct de moniteursIndisponibles
  // ci-dessus (conflit d'horaire ponctuel) : celui-ci ne dépend d'aucun
  // créneau, c'est une indisponibilité déclarée jusqu'à nouvel ordre.
  const moniteursNonDisponibles = useMemo(() => {
    const map = new Map();
    // Dépend de moniteursData (référence stable tant que la requête ne
    // ré-émet pas), pas de `moniteurs` : ce dernier retombe sur un `[]`
    // recréé à chaque rendu tant que la requête n'a pas encore de données,
    // ce qui ferait tourner ce useMemo en boucle (react-hooks/exhaustive-deps).
    for (const moniteur of moniteursData?.data || []) {
      if (moniteur.disponible === false) {
        map.set(
          moniteur.id_moniteur,
          moniteur.cause_indisponibilite || "Indisponibilité déclarée",
        );
      }
    }
    return map;
  }, [moniteursData]);

  const validate = () => {
    const newErrors = {};
    if (!formData.date_heure) newErrors.date_heure = "La date est requise";
    if (!formData.lieu) newErrors.lieu = "Le lieu est requis";
    if (!formData.site) newErrors.site = "Le site est requis";
    if (!formData.type) newErrors.type = "Le type est requis";
    // Filet de sécurité : le select "Niveau requis" ne propose déjà que les
    // valeurs compatibles (voir isTypeNiveauCompatible ci-dessus), mais
    // couvre aussi une valeur restée en mémoire avant un changement de type
    // qui n'aurait pas déclenché le recalage automatique.
    if (
      formData.type &&
      formData.niveau_requis &&
      !isTypeNiveauCompatible(formData.type, formData.niveau_requis)
    ) {
      newErrors.niveau_requis =
        formData.type === "Baptême"
          ? 'Une sortie "Baptême" doit avoir "Baptême" comme niveau requis'
          : `Niveau requis incompatible avec le type "${formData.type}"`;
    }
    if (!formData.nb_places || formData.nb_places < 1)
      newErrors.nb_places = "Minimum 1 place";
    // RG4 : 12 plongeurs max par sortie (réglementation).
    else if (formData.nb_places > 12)
      newErrors.nb_places = "Maximum 12 plongeurs par sortie (réglementation)";
    if (!formData.profondeur_max || formData.profondeur_max < 0)
      newErrors.profondeur_max = "La profondeur est requise";
    if (!formData.date_ouverture_inscriptions)
      newErrors.date_ouverture_inscriptions = "La date d'ouverture est requise";
    if ((formData.latitude === "") !== (formData.longitude === ""))
      newErrors.latitude = "Cliquez sur la carte pour repositionner le site";
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
      console.error("Échec de l'enregistrement de la sortie :", error);
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

  return (
    <form onSubmit={handleSubmit}>
      {/* Corps du formulaire */}
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiCalendar className="w-4 h-4 text-gray-400" />
                Date et heure *
              </span>
            </label>
            <input
              type="datetime-local"
              name="date_heure"
              value={formData.date_heure}
              onChange={handleChange}
              onFocus={() => handleFocus("date_heure")}
              onBlur={handleBlur}
              className={inputClasses("date_heure")}
            />
            {errors.date_heure && (
              <p className="mt-1.5 text-sm text-red-500">{errors.date_heure}</p>
            )}
            {!errors.date_heure && isJourSortieInhabituel(formData.date_heure) && (
              <p className="mt-1.5 text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <FiAlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                Les sorties ont habituellement lieu le mercredi, samedi ou
                dimanche.
              </p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiMapPin className="w-4 h-4 text-gray-400" />
                Lieu *
              </span>
            </label>
            <LieuAutocompleteInput
              name="lieu"
              value={formData.lieu}
              onChange={handleChange}
              onSelect={handleLieuSelected}
              onFocus={() => handleFocus("lieu")}
              onBlur={handleBlur}
              className={inputClasses("lieu")}
              placeholder="Port de Plaisance"
            />
            {errors.lieu && (
              <p className="mt-1.5 text-sm text-red-500">{errors.lieu}</p>
            )}
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Tapez au moins 3 lettres pour des suggestions (carte
              synchronisée automatiquement).
            </p>
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiMap className="w-4 h-4 text-gray-400" />
                Site *
              </span>
            </label>
            <input
              type="text"
              name="site"
              value={formData.site}
              onChange={handleChange}
              onFocus={() => handleFocus("site")}
              onBlur={handleBlur}
              className={inputClasses("site")}
              placeholder="Île de Porquerolles"
            />
            {errors.site && (
              <p className="mt-1.5 text-sm text-red-500">{errors.site}</p>
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
              {TYPE_SORTIE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
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
                <FiAward className="w-4 h-4 text-gray-400" />
                Niveau requis
              </span>
            </label>
            <select
              name="niveau_requis"
              value={formData.niveau_requis}
              onChange={handleChange}
              onFocus={() => handleFocus("niveau_requis")}
              onBlur={handleBlur}
              className={inputClasses("niveau_requis")}
            >
              {/* Ne propose que les niveaux compatibles avec le type choisi
                  (voir isTypeNiveauCompatible) — ex. "Baptême" n'affiche que
                  "Baptême", "Plongée technique" masque Baptême/Niveau 1. La
                  valeur ACTUELLE reste toujours affichée même si elle
                  devient incompatible (sortie existante en modification,
                  combinaison historique antérieure à ce garde-fou) : sinon
                  le <select> n'aurait plus d'<option> correspondant à
                  formData.niveau_requis, et l'affichage divergerait
                  silencieusement de l'état réel (voir aussi validate()
                  ci-dessus, qui bloque la sauvegarde tant que ce n'est pas
                  corrigé). */}
              {NIVEAU_OPTIONS.filter(
                (opt) => opt === formData.niveau_requis || isTypeNiveauCompatible(formData.type, opt),
              ).map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            {errors.niveau_requis && (
              <p className="mt-1.5 text-sm text-red-500">{errors.niveau_requis}</p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiUsers className="w-4 h-4 text-gray-400" />
                Nombre de places *
              </span>
            </label>
            <input
              type="number"
              name="nb_places"
              value={formData.nb_places}
              onChange={handleChange}
              onFocus={() => handleFocus("nb_places")}
              onBlur={handleBlur}
              className={inputClasses("nb_places")}
              min="1"
              max="12"
            />
            {errors.nb_places && (
              <p className="mt-1.5 text-sm text-red-500">{errors.nb_places}</p>
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
            />
            {errors.profondeur_max ? (
              <p className="mt-1.5 text-sm text-red-500">
                {errors.profondeur_max}
              </p>
            ) : (
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                Pré-rempli selon le niveau requis ({PROFONDEUR_MAX_PAR_NIVEAU[formData.niveau_requis] ?? "—"}
                &nbsp;m), modifiable si le site est moins profond.
              </p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiClock className="w-4 h-4 text-gray-400" />
                Durée estimée (HH:MM)
              </span>
            </label>
            <input
              type="time"
              name="duree_estimee"
              value={formData.duree_estimee}
              onChange={handleChange}
              onFocus={() => handleFocus("duree_estimee")}
              onBlur={handleBlur}
              className={inputClasses("duree_estimee")}
            />
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiDollarSign className="w-4 h-4 text-gray-400" />
                Tarif adhérent (€)
              </span>
            </label>
            <input
              type="number"
              step="0.01"
              name="tarif_adherent"
              value={formData.tarif_adherent}
              onChange={handleChange}
              onFocus={() => handleFocus("tarif_adherent")}
              onBlur={handleBlur}
              className={inputClasses("tarif_adherent")}
              placeholder="0.00"
              min="0"
            />
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              {formData.type === "Nettoyage"
                ? "Une sortie « Nettoyage » est gratuite par défaut, modifiable si besoin."
                : "Montant dû par chaque adhérent inscrit à cette sortie (0 = gratuit)."}
            </p>
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiDollarSign className="w-4 h-4 text-gray-400" />
                Tarif non-adhérent (€)
              </span>
            </label>
            <input
              type="number"
              step="0.01"
              name="tarif_non_adherent"
              value={formData.tarif_non_adherent}
              onChange={handleChange}
              onFocus={() => handleFocus("tarif_non_adherent")}
              onBlur={handleBlur}
              className={inputClasses("tarif_non_adherent")}
              placeholder="0.00"
              min="0"
            />
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              Montant dû par un invité non-adhérent (0 = gratuit). Laissé
              vide, le tarif adhérent ci-dessus s&apos;applique par défaut.
            </p>
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiCalendar className="w-4 h-4 text-gray-400" />
                Date ouverture inscriptions *
              </span>
            </label>
            <input
              type="date"
              name="date_ouverture_inscriptions"
              value={formData.date_ouverture_inscriptions}
              onChange={handleChange}
              onFocus={() => handleFocus("date_ouverture_inscriptions")}
              onBlur={handleBlur}
              className={inputClasses("date_ouverture_inscriptions")}
            />
            {!errors.date_ouverture_inscriptions && (
              <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                Pré-rempli à 7 jours avant la sortie, modifiable si besoin.
              </p>
            )}
            {errors.date_ouverture_inscriptions && (
              <p className="mt-1.5 text-sm text-red-500">
                {errors.date_ouverture_inscriptions}
              </p>
            )}
          </motion.div>

          <motion.div {...fadeInUp}>
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiClipboard className="w-4 h-4 text-gray-400" />
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
              {STATUT_SORTIE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </motion.div>

          <motion.div {...fadeInUp} className="md:col-span-2">
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiUserCheck className="w-4 h-4 text-gray-400" />
                Encadrants désignés
              </span>
            </label>
            {loadingMoniteurs ? (
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Chargement des moniteurs…
              </p>
            ) : moniteurs.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Aucun moniteur enregistré pour le moment.
              </p>
            ) : (
              <div className="flex flex-wrap gap-3 pt-1 max-h-48 overflow-y-auto pr-1">
                {moniteurs.map((moniteur) => {
                  const selectionne = formData.encadrants.includes(
                    moniteur.id_moniteur,
                  );
                  const conflit = moniteursIndisponibles.get(moniteur.id_moniteur);
                  const causeIndispo = moniteursNonDisponibles.get(
                    moniteur.id_moniteur,
                  );
                  // Grisé et non cochable seulement si PAS déjà sélectionné :
                  // décocher un moniteur en conflit/indisponible doit
                  // toujours rester possible (c'est justement la façon de
                  // résoudre le conflit ou de le remplacer), jamais bloqué
                  // par son propre statut occupé.
                  const indisponible = (!!conflit || !!causeIndispo) && !selectionne;
                  return (
                    <label
                      key={moniteur.id_moniteur}
                      title={
                        causeIndispo
                          ? `Indisponible : ${causeIndispo}`
                          : conflit
                            ? `Déjà encadrant de "${conflit.lieu || conflit.site || "une autre sortie"}" le ${formatDateTime(conflit.date_heure)}`
                            : undefined
                      }
                      className={`inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                        indisponible
                          ? "text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 cursor-not-allowed"
                          : "text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectionne}
                        disabled={indisponible}
                        onChange={() => toggleEncadrant(moniteur.id_moniteur)}
                        className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed"
                      />
                      {moniteur.user?.name || `Moniteur #${moniteur.id_moniteur}`}
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        ({moniteur.niveau})
                      </span>
                      {causeIndispo ? (
                        <span className="text-xs text-red-600 dark:text-red-400">
                          Indisponible
                        </span>
                      ) : (
                        conflit && (
                          <span className="text-xs text-amber-600 dark:text-amber-400">
                            Indisponible
                          </span>
                        )
                      )}
                    </label>
                  );
                })}
              </div>
            )}
            <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
              {formData.date_heure
                ? "Les moniteurs déjà encadrants d'une autre sortie qui chevauche cet horaire sont grisés (survolez pour voir laquelle)."
                : "Renseignez d'abord la date et l'heure pour repérer les moniteurs déjà occupés sur ce créneau."}
              {" "}Un moniteur déclaré indisponible (voir sa fiche ou son
              profil) est grisé de la même façon et ne peut pas être
              nouvellement désigné.
              {" "}Facultatif à ce stade, l&apos;encadrant de chaque
              palanquée se choisit séparément une fois les palanquées
              constituées.
            </p>
          </motion.div>

          <motion.div {...fadeInUp} className="md:col-span-2">
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiFileText className="w-4 h-4 text-gray-400" />
                Description du site
              </span>
            </label>
            <textarea
              name="description_site"
              value={formData.description_site}
              onChange={handleChange}
              onFocus={() => handleFocus("description_site")}
              onBlur={handleBlur}
              rows="3"
              className={inputClasses("description_site")}
              placeholder="Décrivez le site de plongée..."
            />
          </motion.div>

          <motion.div {...fadeInUp} className="md:col-span-2">
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiInfo className="w-4 h-4 text-gray-400" />
                Conditions d&apos;affectation
              </span>
            </label>
            <textarea
              name="condition_affectation"
              value={formData.condition_affectation}
              onChange={handleChange}
              onFocus={() => handleFocus("condition_affectation")}
              onBlur={handleBlur}
              rows="2"
              className={inputClasses("condition_affectation")}
              placeholder="Conditions spécifiques..."
            />
          </motion.div>

          <motion.div {...fadeInUp} className="md:col-span-2">
            <label className={labelClasses}>
              <span className="flex items-center gap-2">
                <FiMap className="w-4 h-4 text-gray-400" />
                Localisation du site (cliquer sur la carte)
              </span>
            </label>
            <SortieLocationPicker
              latitude={formData.latitude}
              longitude={formData.longitude}
              onChange={handleLocationChange}
              onAddressResolved={handleAddressResolved}
            />
            {errors.latitude && (
              <p className="mt-1 text-xs text-red-500">{errors.latitude}</p>
            )}
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
          {editMode ? "Mettre à jour" : "Créer la sortie"}
        </button>
      </div>
    </form>
  );
};

export default SortieForm;
