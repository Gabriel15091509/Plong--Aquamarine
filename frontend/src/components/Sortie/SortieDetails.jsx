import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import ModalLink from "../Common/ModalLink";
import ConfirmModal from "../Common/ConfirmModal";
import {
  FiCalendar,
  FiMapPin,
  FiUsers,
  FiDroplet,
  FiClock,
  FiEdit,
  FiTag,
  FiAward,
  FiAlertCircle,
  FiTrash2,
  FiInfo,
  FiAnchor,
  FiCheckCircle,
  FiXCircle,
  FiTrendingUp,
  FiBarChart2,
  FiAlertTriangle,
  FiPackage,
  FiMap,
  FiWind,
  FiCloudRain,
  FiZap,
  FiActivity,
  FiUserCheck,
  FiPlayCircle,
} from "react-icons/fi";
import { useSorties } from "../../hooks/Sortie/useSorties";
import { useIncidents } from "../../hooks/Incident/useIncidents";
import { useAttributions } from "../../hooks/Attribution/useAttributions";
import { useMateriels } from "../../hooks/Materiel/useMateriels";
import { useAdherents } from "../../hooks/Adherent/useAdherents";
import { useMoniteurs } from "../../hooks/Moniteur/useMoniteurs";
import { useAuth } from "../../context/AuthContext";
import { useDetailsModal } from "../../hooks/useFormModal";
import { useScrollToHash } from "../../hooks/useScrollToHash";
import DetailsModal from "../Common/DetailsModal";
import LoadingSpinner from "../Common/LoadingSpinner";
import StatusBadge from "../Common/StatusBadge";
import InfoItem from "../Common/InfoItem";
import Pagination from "../Common/Pagination";
import PalanqueesManager from "../Palanquee/PalanqueesManager";
import MaPalanqueeCard from "../Palanquee/MaPalanqueeCard";
import SortiePhotos from "./SortiePhotos";
import SortieRouteMap from "./SortieRouteMap";
import {
  formatDateTime,
  getFinEstimeeSortie,
  sortieDoitEtreCloturee,
  weatherCodeLabel,
} from "../../utils/helpers";
import { STATUT_SORTIE } from "../../utils/constants";

// Fiche sortie, modale par-dessus la liste (voir MoniteurDetails.jsx pour le
// prototype d'origine et DetailsModal.jsx pour la coquille commune).
// Plafonnée à 3 pages (voir DetailsModal.jsx), la plus riche des 15 fiches
// à regrouper : "Vue d'ensemble" (infos + description), "Météo &
// itinéraire" (prévision + carte, absente s'il n'y a pas de position) et
// "Activité" (incidents + matériel + palanquées, les vraies sous-listes
// avec leur propre gestion, empilées plutôt qu'étalées sur 3 pages à part).
// Colonne de droite de "Vue d'ensemble" : rééquilibrée avec la gauche
// (7 champs de chaque côté environ, au lieu de 3 à droite pour 10 à
// gauche) et complétée par un aperçu météo (vent/houle/ciel) quand une
// position existe — sinon elle restait nettement plus courte que la
// gauche, avec tout cet espace perdu en dessous plutôt qu'utilisé.
const SortieDetails = () => {
  const modal = useDetailsModal("/sorties");
  const { id } = modal;
  // PlongeeDetails.jsx (lien "Voir les photos de la sortie") renvoie ici via
  // `/sorties/:id#photos` — repris plus bas pour ouvrir directement sur la
  // page "Activité" (qui contient les photos) plutôt que sur "Vue
  // d'ensemble" — même mécanique que AdherentDetails.jsx + #materiel-attribue
  // (voir DetailsModal.jsx, prop `initialPageIndex`).
  const { hash } = useLocation();
  const { user, hasRole } = useAuth();
  const canManageSortie = hasRole(["president", "moniteur"]);
  // La gestion du matériel (attribuer/retirer) reste réservée au président
  // partout ailleurs dans l'appli (canSeeMateriel dans Sidebar.jsx, route
  // /attributions/create) — un moniteur (voire un adhérent, cette page leur
  // est aussi accessible) ne doit donc pas voir le lien "+ Attribuer du
  // matériel" plus bas, même si la liste du matériel déjà attribué reste
  // visible à tous en lecture seule.
  const canManageMateriel = hasRole(["president"]);
  const {
    useGetById,
    useGetMeteo,
    useRemove,
    useUpdate,
    useAnnulerPourMeteo,
    useGetPropositionsReprogrammation,
    useReplanifier,
  } = useSorties();
  const { useGetBySortie } = useIncidents();
  const { useGetBySortie: useGetAttributionsBySortie } = useAttributions();
  const { useGetAll: useGetAllMateriels } = useMateriels();
  const { useGetAll: useGetAllAdherents } = useAdherents();
  const { useGetAll: useGetAllMoniteurs } = useMoniteurs();
  const { data, isLoading } = useGetById(id);
  const { data: moniteursData } = useGetAllMoniteurs({}, { enabled: !!id });
  const { data: meteoData, isLoading: loadingMeteo } = useGetMeteo(id);
  // N'interroge le backend que si la sortie est déjà annulée pour météo —
  // route à part (voir SortieService.getPropositionsReprogrammation),
  // inutile de la solliciter tant qu'on ne sait pas encore si elle sert.
  const { data: propositionsData, isLoading: loadingPropositions } =
    useGetPropositionsReprogrammation(id, {
      enabled: !!meteoData?.data?.annuleePourMeteo,
    });
  const { data: incidentsData } = useGetBySortie(id);
  const { data: attributionsData } = useGetAttributionsBySortie(id);
  const { data: materielsData } = useGetAllMateriels({}, { enabled: !!id });
  const { data: adherentsData } = useGetAllAdherents({}, { enabled: !!id });
  const remove = useRemove();
  const update = useUpdate();
  const annulerPourMeteo = useAnnulerPourMeteo();
  const replanifier = useReplanifier();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAnnulerModal, setShowAnnulerModal] = useState(false);
  const [showAnnulerMeteoModal, setShowAnnulerMeteoModal] = useState(false);
  // Date choisie parmi les propositions (voir plus bas) en attente de
  // confirmation — null tant qu'aucune n'a été cliquée.
  const [replanifierModal, setReplanifierModal] = useState(null);
  // Incidents/matériel attribué pour cette sortie : une sortie à forte
  // participation peut en accumuler des dizaines (ex. matériel attribué à
  // chaque inscrit) — pagination plutôt que tout afficher d'un coup (même
  // principe que "Mon matériel attribué", ProfilePage.jsx).
  const [incidentsPage, setIncidentsPage] = useState(1);
  const [attributionsMaterielPage, setAttributionsMaterielPage] = useState(1);
  const HISTORIQUE_PAR_PAGE = 4;

  const sortie = data?.data;
  // Arrivée via #photos (voir plus haut) : sélectionner la bonne PAGE
  // ("Activité") ne suffit pas — Incidents/Matériel/Palanquées passent
  // avant Photos sur cette page, qui peut donc s'ouvrir hors champ si son
  // contenu dépasse la hauteur visible de la modale — même hook que
  // ProfilePage.jsx + #materiel-attribue pour le défilement fin.
  useScrollToHash(!isLoading && !!sortie);
  const meteo = meteoData?.data;
  const propositions = propositionsData?.data || [];
  const incidents = incidentsData?.data || [];
  const attributionsMateriel = attributionsData?.data || [];
  const materielMap = {};
  materielsData?.data?.forEach((m) => {
    materielMap[m.num_inventaire] = `${m.marque} ${m.modele}`;
  });
  const adherentMap = {};
  adherentsData?.data?.forEach((a) => {
    adherentMap[a.num_adherent] = `${a.nom} ${a.prenom}`;
  });
  const moniteurMap = {};
  moniteursData?.data?.forEach((m) => {
    moniteurMap[m.id_moniteur] =
      (m.user?.name || `Moniteur #${m.id_moniteur}`) +
      (m.disponible === false ? " (indisponible)" : "");
  });
  const encadrantsNoms = (sortie?.encadrants || []).map(
    (idMoniteur) => moniteurMap[idMoniteur] || `Moniteur #${idMoniteur}`,
  );
  // Parmi les encadrants désignés, ceux qui se sont depuis déclarés (ou ont
  // été déclarés par le président) indisponibles — voir
  // MoniteurAvailabilityToggle.jsx. N'a d'intérêt que tant que la sortie
  // est encore modifiable ("Planifiée" : voir isVerrouillee plus bas), pour
  // que le président pense à réaffecter avant le départ.
  const encadrantsIndisponibles = (sortie?.encadrants || [])
    .map((idMoniteur) => moniteursData?.data?.find((m) => m.id_moniteur === idMoniteur))
    .filter((m) => m && m.disponible === false);

  // Durée estimée dépassée mais le statut n'a pas été mis à jour
  // manuellement : on alerte le staff pour qu'il clôture/annule. Basé sur
  // date_heure + duree_estimee (pas juste date_heure) : le passage à "En
  // cours" est désormais automatique dès le départ (SortieService
  // .demarrerSortiesEchues), donc une sortie qui vient tout juste de
  // démarrer ne doit pas être signalée comme "à terminer" — voir
  // utils/helpers.js:sortieDoitEtreCloturee.
  const needsStatusUpdate = !!sortie && sortieDoitEtreCloturee(sortie);
  const finEstimee = sortie ? getFinEstimeeSortie(sortie) : null;
  // Un incident se constate forcément PENDANT la sortie (en mer, sur site) —
  // ni avant (rien ne s'est encore passé, sortie encore "Planifiée") ni
  // après coup une fois "Terminée"/"Annulée".
  const peutDeclarerIncident = sortie?.statut === STATUT_SORTIE.EN_COURS;
  const raisonIncidentIndisponible =
    sortie?.statut === STATUT_SORTIE.PLANIFIEE
      ? "Sortie pas encore commencée : déclaration d'incident impossible"
      : sortie?.statut === STATUT_SORTIE.ANNULEE
        ? "Sortie annulée : déclaration d'incident impossible"
        : "Sortie terminée : déclaration d'incident impossible";
  // Même principe que l'incident ci-dessus : attribuer du matériel ou
  // constituer une palanquée n'a de sens que pendant la sortie elle-même
  // (le matériel part avec les plongeurs, les palanquées se forment sur les
  // présents pointés) — ni avant (rien à équiper/pointer encore) ni après
  // coup une fois "Terminée"/"Annulée".
  const raisonActionEnCoursSeuleIndisponible = (action) =>
    sortie?.statut === STATUT_SORTIE.PLANIFIEE
      ? `Sortie pas encore commencée : ${action} impossible`
      : sortie?.statut === STATUT_SORTIE.ANNULEE
        ? `Sortie annulée : ${action} impossible`
        : `Sortie terminée : ${action} impossible`;
  // Verrouillé côté serveur (SortieService.update/delete) dès que la sortie
  // a quitté "Planifiée" — pas seulement une fois "Terminée".
  const isVerrouillee = !!sortie && sortie.statut !== STATUT_SORTIE.PLANIFIEE;
  const isEnCours = sortie?.statut === STATUT_SORTIE.EN_COURS;

  const handleChangeStatut = async (statut) => {
    try {
      await update.mutateAsync({ id, data: { statut } });
    } catch (error) {
      // Erreur déjà notifiée via toast par le hook useUpdate
    }
  };

  const handleAnnuler = async () => {
    try {
      await update.mutateAsync({ id, data: { statut: STATUT_SORTIE.ANNULEE } });
      setShowAnnulerModal(false);
    } catch (error) {
      // Erreur déjà notifiée via toast par le hook useUpdate — modale
      // laissée ouverte, même principe que handleAnnulerPourMeteo ci-dessous.
    }
  };

  const handleDelete = async () => {
    try {
      await remove.mutateAsync(id);
      setShowDeleteModal(false);
      modal.close();
    } catch (error) {
      // Erreur déjà notifiée via toast par le hook useRemove
    }
  };

  const handleAnnulerPourMeteo = async () => {
    try {
      await annulerPourMeteo.mutateAsync(id);
      setShowAnnulerMeteoModal(false);
    } catch (error) {
      // Erreur déjà notifiée via toast par le hook useAnnulerPourMeteo
    }
  };

  const handleReplanifier = async () => {
    try {
      await replanifier.mutateAsync({ id, data: { date_heure: replanifierModal } });
      setReplanifierModal(null);
    } catch (error) {
      // Erreur déjà notifiée via toast par le hook useReplanifier — modale
      // laissée ouverte (même principe que handleAnnulerPourMeteo ci-dessus).
    }
  };

  // Actions de gestion de CETTE sortie (Déclarer un incident/Modifier/
  // Supprimer, "À terminer"/"Annuler pour météo", constitution des
  // palanquées) : réservées au président (accès total) ou au moniteur
  // explicitement désigné encadrant ici (Sortie.encadrants) — un autre
  // moniteur, staff du club mais non désigné sur CETTE sortie, ne les voit
  // plus. Même correctif côté API (SortieService.assertCanManageSortie /
  // IncidentService.assertCanDeclareIncident), donc pas seulement cosmétique
  // — même correctif que SortiesPage.jsx:canManageCetteSortie.
  const currentMoniteurId =
    moniteursData?.data?.find((m) => m.user?.email === user?.email)
      ?.id_moniteur || null;
  const canManageCetteSortie =
    !!sortie &&
    canManageSortie &&
    (user?.role === "president" ||
      (currentMoniteurId != null &&
        Array.isArray(sortie.encadrants) &&
        sortie.encadrants.includes(currentMoniteurId)));

  const headerExtra = sortie && canManageCetteSortie && (
    <>
      {!peutDeclarerIncident ? (
        <span
          className="p-2 text-gray-300 dark:text-gray-700 cursor-not-allowed"
          title={`Déclarer un incident — ${raisonIncidentIndisponible}`}
        >
          <FiAlertTriangle className="w-4 h-4" />
        </span>
      ) : (
        <ModalLink
          to={`/incidents/create?id_sortie=${sortie.id_sortie}`}
          title="Déclarer un incident"
          className="p-2 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-xl transition-colors"
        >
          <FiAlertTriangle className="w-4 h-4" />
        </ModalLink>
      )}
      {isVerrouillee ? (
        <span
          className="p-2 text-gray-300 dark:text-gray-700 cursor-not-allowed"
          title='Modifier — Cette sortie a quitté le statut "Planifiée" : modification impossible'
        >
          <FiEdit className="w-4 h-4" />
        </span>
      ) : (
        <ModalLink
          to={`/sorties/edit/${sortie.id_sortie}`}
          title="Modifier"
          className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-colors"
        >
          <FiEdit className="w-4 h-4" />
        </ModalLink>
      )}
      {sortie.statut === STATUT_SORTIE.PLANIFIEE ? (
        <button
          onClick={() => setShowAnnulerModal(true)}
          disabled={update.isPending}
          title="Annuler la sortie"
          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FiXCircle className="w-4 h-4" />
        </button>
      ) : isEnCours ? (
        <span
          className="p-2 text-gray-300 dark:text-gray-700 cursor-not-allowed"
          title="Sortie en cours : ni annulation ni suppression possible"
        >
          <FiXCircle className="w-4 h-4" />
        </span>
      ) : (
        <button
          onClick={() => setShowDeleteModal(true)}
          disabled={remove.isPending}
          title="Supprimer"
          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FiTrash2 className="w-4 h-4" />
        </button>
      )}
    </>
  );

  if (isLoading || !sortie) {
    return (
      <DetailsModal
        isOpen={modal.isOpen}
        onClose={modal.close}
        title={isLoading ? "Chargement…" : "Sortie non trouvée"}
        icon={FiAnchor}
        pages={[
          {
            label: "",
            content: isLoading ? (
              <div className="flex items-center justify-center py-10">
                <LoadingSpinner variant="details" />
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-10">
                La sortie que vous recherchez n&apos;existe pas ou a été
                supprimée.
              </p>
            ),
          },
        ]}
      />
    );
  }

  const getStatutColor = (statut) => {
    const colors = {
      [STATUT_SORTIE.PLANIFIEE]:
        "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
      [STATUT_SORTIE.EN_COURS]:
        "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
      Confirmée:
        "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
      [STATUT_SORTIE.ANNULEE]:
        "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
      [STATUT_SORTIE.TERMINEE]:
        "bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800",
      Reportée:
        "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
    };
    return colors[statut] || colors[STATUT_SORTIE.PLANIFIEE];
  };

  const getStatutIcon = (statut) => {
    const icons = {
      [STATUT_SORTIE.PLANIFIEE]: FiCalendar,
      [STATUT_SORTIE.EN_COURS]: FiPlayCircle,
      Confirmée: FiCheckCircle,
      [STATUT_SORTIE.ANNULEE]: FiXCircle,
      [STATUT_SORTIE.TERMINEE]: FiTrendingUp,
      Reportée: FiClock,
    };
    return icons[statut] || FiCalendar;
  };

  const StatutIcon = getStatutIcon(sortie.statut);
  const hasPosition = sortie.latitude != null && sortie.longitude != null;

  const pages = [
    {
      label: "Vue d'ensemble",
      icon: FiInfo,
      content: (
        <div className="space-y-3">
          {sortie.statut === STATUT_SORTIE.PLANIFIEE &&
            encadrantsIndisponibles.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-2.5">
                <div className="flex items-center gap-2">
                  <FiAlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <p className="text-sm font-medium text-red-800 dark:text-red-300">
                    {encadrantsIndisponibles.length === 1
                      ? `${encadrantsIndisponibles[0].user?.name || "Un encadrant désigné"} est indisponible`
                      : `${encadrantsIndisponibles.length} encadrants désignés sont indisponibles`}
                    {" — "}
                    {encadrantsIndisponibles
                      .map((m) => m.cause_indisponibilite)
                      .filter(Boolean)
                      .join(" · ") || "choisissez un autre encadrant disponible."}
                  </p>
                </div>
                {canManageCetteSortie && (
                  <ModalLink
                    to={`/sorties/edit/${sortie.id_sortie}`}
                    className="flex-shrink-0 px-3 py-1.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                  >
                    Changer d&apos;encadrant
                  </ModalLink>
                )}
              </div>
            )}

          {needsStatusUpdate && canManageCetteSortie && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-2.5">
              <div className="flex items-center gap-2">
                <FiAlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  Durée estimée dépassée (fin prévue vers{" "}
                  {formatDateTime(finEstimee)}), statut toujours «{" "}
                  {sortie.statut} ».
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => handleChangeStatut("Terminée")}
                  disabled={update.isPending}
                  className="px-3 py-1.5 text-sm font-semibold text-white bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  Marquer terminée
                </button>
                {sortie.statut === STATUT_SORTIE.PLANIFIEE && (
                  <button
                    onClick={() => handleChangeStatut("Annulée")}
                    disabled={update.isPending}
                    className="px-3 py-1.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Annuler
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Bandeau statut, compact */}
          <div
            className={`rounded-xl p-2.5 border flex items-center justify-between gap-3 flex-wrap ${getStatutColor(sortie.statut)}`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-full ${
                  sortie.statut === "Confirmée"
                    ? "bg-green-100 dark:bg-green-900/30"
                    : sortie.statut === STATUT_SORTIE.ANNULEE
                      ? "bg-red-100 dark:bg-red-900/30"
                      : sortie.statut === STATUT_SORTIE.TERMINEE
                        ? "bg-gray-100 dark:bg-gray-800/30"
                        : sortie.statut === "Reportée"
                          ? "bg-yellow-100 dark:bg-yellow-900/30"
                          : "bg-blue-100 dark:bg-blue-900/30"
                }`}
              >
                <StatutIcon
                  className={`w-5 h-5 ${
                    sortie.statut === "Confirmée"
                      ? "text-green-600 dark:text-green-400"
                      : sortie.statut === STATUT_SORTIE.ANNULEE
                        ? "text-red-600 dark:text-red-400"
                        : sortie.statut === STATUT_SORTIE.TERMINEE
                          ? "text-gray-600 dark:text-gray-400"
                          : sortie.statut === "Reportée"
                            ? "text-yellow-600 dark:text-yellow-400"
                            : "text-blue-600 dark:text-blue-400"
                  }`}
                />
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">
                  {sortie.statut}
                </p>
                {sortie.statut === STATUT_SORTIE.ANNULEE && sortie.motif_annulation && (
                  <p className="text-xs text-red-600 dark:text-red-400">
                    {sortie.motif_annulation}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span>{sortie.nb_places} places</span>
              <span>{sortie.profondeur_max}m max</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
            <div className="space-y-1">
              <InfoItem
                icon={FiTag}
                label="Type de sortie"
                value={sortie.type}
                highlight
              />
              <InfoItem
                icon={FiCalendar}
                label="Date et heure"
                value={formatDateTime(sortie.date_heure)}
              />
              <InfoItem icon={FiMapPin} label="Lieu" value={sortie.lieu} />
              <InfoItem icon={FiMapPin} label="Site" value={sortie.site} />
              <InfoItem
                icon={FiAward}
                label="Niveau requis"
                value={sortie.niveau_requis || "Tous niveaux"}
              />
              <InfoItem
                icon={FiUsers}
                label="Nombre de places"
                value={`${sortie.nb_places} places`}
              />
              <InfoItem
                icon={FiDroplet}
                label="Profondeur max"
                value={`${sortie.profondeur_max} mètres`}
              />
            </div>
            {/* Colonne de droite : le reste des champs, puis un aperçu météo
                (voir plus bas) quand une position est renseignée — plutôt
                que de la laisser bien plus courte que la colonne de gauche
                (espace gaspillé en dessous). */}
            <div className="space-y-1">
              <InfoItem
                icon={FiCalendar}
                label="Ouverture des inscriptions"
                value={formatDateTime(sortie.date_ouverture_inscriptions)}
                highlight
              />
              <InfoItem
                icon={FiAward}
                label="Statut"
                value={<StatusBadge status={sortie.statut} />}
              />
              <InfoItem
                icon={FiBarChart2}
                label="Places disponibles"
                value={
                  <span className="font-semibold">
                    {sortie.places_disponibles ?? sortie.nb_places} /{" "}
                    {sortie.nb_places} places
                    {sortie.places_disponibles === 0 && (
                      <span className="text-orange-600 dark:text-orange-400 font-medium ml-1">
                        (Complet)
                      </span>
                    )}
                  </span>
                }
              />
              <InfoItem
                icon={FiClock}
                label="Durée estimée"
                value={sortie.duree_estimee || "Non définie"}
              />
              <InfoItem
                icon={FiTag}
                label="Tarif adhérent"
                value={
                  Number(sortie.tarif_adherent) > 0
                    ? `${Number(sortie.tarif_adherent).toFixed(2)} €`
                    : "Gratuit"
                }
              />
              {sortie.tarif_non_adherent != null && (
                <InfoItem
                  icon={FiTag}
                  label="Tarif non-adhérent"
                  value={`${Number(sortie.tarif_non_adherent).toFixed(2)} €`}
                />
              )}
              <InfoItem
                icon={FiUserCheck}
                label="Encadrants désignés"
                value={
                  encadrantsNoms.length > 0
                    ? encadrantsNoms.join(", ")
                    : "Aucun encadrant désigné pour l'instant"
                }
              />
            </div>
          </div>

          {/* Description — fusionnée ici (plutôt qu'une page à part) pour
              rester sous la limite de 3 pages (voir DetailsModal.jsx). */}
          {(sortie.description_site || sortie.condition_affectation) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sortie.description_site && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
                    Description du site
                  </p>
                  <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
                      {sortie.description_site}
                    </p>
                  </div>
                </div>
              )}
              {sortie.condition_affectation && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
                    Conditions d&apos;affectation
                  </p>
                  <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
                      {sortie.condition_affectation}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ),
    },
  ];

  if (hasPosition) {
    pages.push({
      label: meteo?.forecast?.historique ? "Météo observée" : "Prévision météo",
      icon: FiWind,
      content: (
        <div className="space-y-3">
          {meteo?.disponible && (
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                meteo.dangereux
                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              }`}
            >
              {meteo.dangereux ? (
                <FiAlertTriangle className="w-3.5 h-3.5" />
              ) : (
                <FiCheckCircle className="w-3.5 h-3.5" />
              )}
              {meteo.annuleePourMeteo
                ? "Annulée pour météo"
                : meteo.dangereux
                  ? meteo.forecast?.historique
                    ? "Conditions dégradées"
                    : "Conditions dangereuses"
                  : "Conditions favorables"}
            </span>
          )}

          {loadingMeteo ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 py-2">
              Chargement de la prévision…
            </p>
          ) : !meteo?.disponible ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-2 flex items-start gap-2">
              <FiInfo className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {meteo?.raison || "Prévision météo indisponible."}
            </p>
          ) : meteo.annuleePourMeteo ? (
            // Sortie annulée pour météo : on n'affiche plus les valeurs
            // chiffrées (vent/houle/ciel) recalculées en direct — elles ont
            // pu évoluer depuis la décision et contrediraient visuellement
            // le motif d'annulation, qui seul fait foi ici.
            <div className="space-y-3">
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-start gap-2">
                <FiInfo className="w-4 h-4 mt-0.5 flex-shrink-0" />
                Motif enregistré au moment de l&apos;annulation automatique.
                Les valeurs météo ont pu évoluer depuis : elles ne sont plus
                affichées ici pour éviter toute confusion.
              </p>
              {meteo.motifs?.length > 0 && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50">
                  <ul className="text-sm text-red-700 dark:text-red-400 list-disc list-inside space-y-0.5">
                    {meteo.motifs.map((motif) => (
                      <li key={motif}>{motif}</li>
                    ))}
                  </ul>
                </div>
              )}
              {/* Dates de repli (voir SortieService.
                  getPropositionsReprogrammation) — jusque-là seulement
                  envoyées par email à l'organisateur, ici sélectionnables
                  directement pour replanifier sans recréer la sortie à la
                  main. Réservé à qui peut gérer cette sortie (même garde
                  que "Annuler pour météo" ci-dessous). */}
              {canManageCetteSortie && (
                <div className="pt-1">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <FiCalendar className="w-4 h-4" />
                    Dates alternatives pour replanifier
                  </p>
                  {loadingPropositions ? (
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      Recherche de créneaux disponibles…
                    </p>
                  ) : propositions.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Aucun créneau libre trouvé automatiquement dans les 3
                      prochaines semaines (chaque proposition évite tout
                      chevauchement avec une autre sortie déjà planifiée).
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {propositions.map((proposition) => (
                        <button
                          key={proposition.date_heure}
                          onClick={() => setReplanifierModal(proposition.date_heure)}
                          disabled={replanifier.isPending}
                          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span
                            title={
                              !proposition.meteo
                                ? "Météo pas encore prévisible pour cette date"
                                : proposition.meteo.dangereux
                                  ? "Conditions déjà jugées dangereuses pour cette date"
                                  : "Conditions favorables"
                            }
                          >
                            {!proposition.meteo ? (
                              <FiInfo className="w-4 h-4 text-gray-400" />
                            ) : proposition.meteo.dangereux ? (
                              <FiAlertTriangle className="w-4 h-4 text-red-500" />
                            ) : (
                              <FiCheckCircle className="w-4 h-4 text-green-500" />
                            )}
                          </span>
                          {formatDateTime(proposition.date_heure)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                <InfoItem
                  icon={FiWind}
                  label="Vent max"
                  value={
                    meteo.forecast.windspeed !== null
                      ? `${Math.round(meteo.forecast.windspeed)} km/h${
                          meteo.forecast.windgusts !== null
                            ? ` (rafales ${Math.round(meteo.forecast.windgusts)} km/h)`
                            : ""
                        }`
                      : "Non disponible"
                  }
                />
                <InfoItem
                  icon={FiActivity}
                  label="Houle max"
                  value={
                    meteo.forecast.waveHeight !== null
                      ? `${meteo.forecast.waveHeight.toFixed(1)} m`
                      : "Non disponible (hors zone marine ou fenêtre de prévision)"
                  }
                />
                <InfoItem
                  icon={FiZap}
                  label={meteo.forecast.historique ? "Ciel observé" : "Ciel prévu"}
                  value={weatherCodeLabel(meteo.forecast.weathercode) || "Non disponible"}
                />
                <InfoItem
                  icon={FiCloudRain}
                  label="Précipitations"
                  value={
                    meteo.forecast.precipitation !== null
                      ? `${Math.round(meteo.forecast.precipitation)} mm`
                      : "Non disponible"
                  }
                />
              </div>
              {meteo.dangereux && meteo.motifs?.length > 0 && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50">
                  <ul className="text-sm text-red-700 dark:text-red-400 list-disc list-inside space-y-0.5">
                    {meteo.motifs.map((motif) => (
                      <li key={motif}>{motif}</li>
                    ))}
                  </ul>
                </div>
              )}
              {/* Décision humaine réservée au président/moniteur — voir
                  SortieService.annulerPourMeteo. Le cron ne fait qu'alerter
                  à J-1 (aucune annulation automatique aussi proche du
                  départ) : c'est ce bouton qui couvre la décision. */}
              {meteo.dangereux &&
                canManageCetteSortie &&
                sortie.statut === STATUT_SORTIE.PLANIFIEE && (
                  <button
                    onClick={() => setShowAnnulerMeteoModal(true)}
                    disabled={annulerPourMeteo.isPending}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors duration-150 disabled:opacity-50"
                  >
                    <FiXCircle className="w-4 h-4" />
                    Annuler pour cause météorologique
                  </button>
                )}
            </>
          )}

          {/* Itinéraire — fusionné avec la météo sur une même page (plutôt
              qu'une page à part) pour rester sous la limite de 3 pages
              (voir DetailsModal.jsx). */}
          <div className="pt-1">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5 flex items-center gap-2">
              <FiMap className="w-3.5 h-3.5" />
              Itinéraire
            </p>
            <SortieRouteMap
              siteLat={Number(sortie.latitude)}
              siteLng={Number(sortie.longitude)}
              siteName={sortie.site}
            />
          </div>
        </div>
      ),
    });
  }

  // Incidents + Matériel + Palanquées : trois vraies sous-listes avec leur
  // propre gestion, empilées sur une même page plutôt qu'étalées sur 3
  // pages à part pour rester sous la limite de 3 pages (voir
  // DetailsModal.jsx).
  pages.push({
    label: "Activité",
    icon: FiActivity,
    content: (
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-2">
              <FiAlertTriangle className="w-3.5 h-3.5" />
              Incidents ({incidents.length})
            </p>
            {!peutDeclarerIncident ? (
              <span
                className="text-sm font-medium text-gray-400 dark:text-gray-600 cursor-not-allowed"
                title={raisonIncidentIndisponible}
              >
                + Déclarer un incident
              </span>
            ) : (
              <ModalLink
                to={`/incidents/create?id_sortie=${sortie.id_sortie}`}
                className="text-sm font-medium text-red-600 dark:text-red-400 hover:underline"
              >
                + Déclarer un incident
              </ModalLink>
            )}
          </div>
          {incidents.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Aucun incident déclaré pour cette sortie.
            </p>
          ) : (
            // Grille (plutôt qu'empilé sur toute la largeur) : chaque carte
            // n'a que 2 courtes lignes de texte + un badge, un `flex
            // justify-between` sur toute la largeur de la modale laissait
            // un grand vide entre les deux (voir DetailsModal.jsx).
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {incidents
                  .slice(
                    (incidentsPage - 1) * HISTORIQUE_PAR_PAGE,
                    incidentsPage * HISTORIQUE_PAR_PAGE,
                  )
                  .map((incident) => (
                    <ModalLink
                      key={incident.id_incident}
                      to={`/incidents/${incident.id_incident}`}
                      className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {incident.type}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                          {incident.description}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${
                          incident.cloture
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {incident.cloture ? "Clôturé" : "Non clôturé"}
                      </span>
                    </ModalLink>
                  ))}
              </div>
              <Pagination
                currentPage={incidentsPage}
                totalPages={Math.ceil(incidents.length / HISTORIQUE_PAR_PAGE)}
                onPageChange={setIncidentsPage}
                scrollToTop={false}
              />
            </>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-2">
              <FiPackage className="w-3.5 h-3.5" />
              Matériel ({attributionsMateriel.length})
            </p>
            {canManageMateriel &&
              (!isEnCours ? (
                <span
                  className="text-sm font-medium text-gray-400 dark:text-gray-600 cursor-not-allowed"
                  title={raisonActionEnCoursSeuleIndisponible("l'attribution de matériel")}
                >
                  + Attribuer du matériel
                </span>
              ) : (
                <ModalLink
                  to={`/attributions/create?id_sortie=${sortie.id_sortie}`}
                  className="text-sm font-medium text-cyan-600 dark:text-cyan-400 hover:underline"
                >
                  + Attribuer du matériel
                </ModalLink>
              ))}
          </div>
          {attributionsMateriel.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Aucun matériel attribué pour cette sortie.
            </p>
          ) : (
            // Même grille que les incidents ci-dessus (voir commentaire).
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {attributionsMateriel
                  .slice(
                    (attributionsMaterielPage - 1) * HISTORIQUE_PAR_PAGE,
                    attributionsMaterielPage * HISTORIQUE_PAR_PAGE,
                  )
                  .map((attribution) => {
                    const rendu = !!attribution.date_retour_reel;
                    return (
                      <ModalLink
                        key={attribution.id_attribution}
                        to={`/attributions/${attribution.id_attribution}`}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {materielMap[attribution.num_inventaire] || `Matériel #${attribution.num_inventaire}`}
                            {" → "}
                            {adherentMap[attribution.num_adherent] || `Adhérent #${attribution.num_adherent}`}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            Départ : {attribution.etat_depart}
                            {rendu && ` • Retour : ${attribution.etat_retour}`}
                            {attribution.constat_deterioration && " • Détérioration constatée"}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${
                            rendu
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          }`}
                        >
                          {rendu ? "Rendu" : "En cours"}
                        </span>
                      </ModalLink>
                    );
                  })}
              </div>
              <Pagination
                currentPage={attributionsMaterielPage}
                totalPages={Math.ceil(
                  attributionsMateriel.length / HISTORIQUE_PAR_PAGE,
                )}
                onPageChange={setAttributionsMaterielPage}
                scrollToTop={false}
              />
            </>
          )}
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5 flex items-center gap-2">
            <FiUsers className="w-3.5 h-3.5" />
            {/* Constitution des palanquées (moniteur désigné encadrant /
                président) ou, à défaut, vue lecture seule de sa propre
                palanquée pour cette sortie — le staff désigné encadrant a
                déjà mieux via PalanqueesManager, pas besoin de dupliquer.
                Concerne aussi bien un adhérent qu'un moniteur non désigné
                sur CETTE sortie : il n'a plus la main sur la gestion, mais
                reste inscrit comme n'importe quel autre participant. */}
            {canManageCetteSortie ? "Palanquées" : "Ma palanquée"}
          </p>
          {canManageCetteSortie ? (
            <PalanqueesManager sortie={sortie} />
          ) : (
            <MaPalanqueeCard idSortie={sortie.id_sortie} />
          )}
        </div>

        {/* Empilée ici plutôt qu'en 4e page à part : la limite est de 3
            pages (voir DetailsModal.jsx) — SortiePhotos gère elle-même
            l'accès restreint aux participants (message "réservé" au lieu du
            contenu si le backend renvoie 403, voir assertCanAccessPhotos).
            id="photos" : cible du lien "Voir les photos de la sortie"
            (PlongeeDetails.jsx) — voir initialPageIndex plus bas, qui
            sélectionne déjà cette page, et le useEffect de scrollIntoView
            plus haut, qui amène ensuite cette section précise en vue
            (Incidents/Matériel/Palanquées passent avant elle ici). */}
        <div id="photos">
          <SortiePhotos sortie={sortie} />
        </div>
      </div>
    ),
  });

  // Cible "Activité" (contient les photos, voir ci-dessus) quand on arrive
  // via #photos ; "Vue d'ensemble" (index 0) dans tous les autres cas.
  const activitePageIndex = pages.findIndex((p) => p.label === "Activité");
  const initialPageIndex =
    hash === "#photos" && activitePageIndex !== -1 ? activitePageIndex : 0;

  return (
    <>
      <DetailsModal
        isOpen={modal.isOpen}
        onClose={modal.close}
        initialPageIndex={initialPageIndex}
        title={`${sortie.type} - ${sortie.lieu}`}
        subtitle={`N°${sortie.id_sortie} • ${sortie.site} • ${formatDateTime(sortie.date_heure)}`}
        icon={FiAnchor}
        headerExtra={headerExtra}
        pages={pages}
      />

      {/* Modal suppression (sortie "Terminée"/"Annulée" — voir headerExtra) */}
      <ConfirmModal
        isOpen={showDeleteModal}
        icon={FiAlertCircle}
        message={
          <>
            Êtes-vous sûr de vouloir supprimer la sortie{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {sortie.type} - {sortie.lieu}
            </span>
            ?
          </>
        }
        confirmLabel="Confirmer la suppression"
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
      />

      {/* Modal annulation (sortie encore "Planifiée" — voir headerExtra) */}
      <ConfirmModal
        isOpen={showAnnulerModal}
        icon={FiXCircle}
        message={
          <>
            Êtes-vous sûr de vouloir annuler la sortie{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {sortie.type} - {sortie.lieu}
            </span>
            ?
          </>
        }
        confirmLabel="Confirmer l'annulation"
        onCancel={() => setShowAnnulerModal(false)}
        onConfirm={handleAnnuler}
      />

      {/* Modal annulation météo */}
      <ConfirmModal
        isOpen={showAnnulerMeteoModal}
        icon={FiAlertTriangle}
        message={
          <>
            Annuler la sortie{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {sortie.type} - {sortie.lieu}
            </span>{" "}
            pour cause météorologique ? Les adhérents inscrits seront
            notifiés par email et le motif météo leur sera affiché sur la
            fiche de la sortie.
          </>
        }
        confirmLabel="Confirmer l'annulation"
        onCancel={() => setShowAnnulerMeteoModal(false)}
        onConfirm={handleAnnulerPourMeteo}
      />

      {/* Modal replanification (choix d'une date alternative dans la page
          "Météo") */}
      <ConfirmModal
        isOpen={!!replanifierModal}
        icon={FiCalendar}
        message={
          <>
            Replanifier la sortie{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {sortie.type} - {sortie.lieu}
            </span>{" "}
            au{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {replanifierModal ? formatDateTime(replanifierModal) : ""}
            </span>
            ? Elle repasse « Planifiée » et les adhérents déjà inscrits
            seront notifiés par email et par notification de la nouvelle
            date.
          </>
        }
        confirmLabel="Confirmer la replanification"
        onCancel={() => setReplanifierModal(null)}
        onConfirm={handleReplanifier}
      />
    </>
  );
};

export default SortieDetails;
