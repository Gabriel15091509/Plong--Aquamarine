import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import ConfirmModal from "../Common/ConfirmModal";
import {
  FiCalendar,
  FiMapPin,
  FiUsers,
  FiDroplet,
  FiClock,
  FiEdit,
  FiArrowLeft,
  FiTag,
  FiAward,
  FiFileText,
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
} from "react-icons/fi";
import { useSorties } from "../../hooks/Sortie/useSorties";
import { useIncidents } from "../../hooks/Incident/useIncidents";
import { useAttributions } from "../../hooks/Attribution/useAttributions";
import { useMateriels } from "../../hooks/Materiel/useMateriels";
import { useAdherents } from "../../hooks/Adherent/useAdherents";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../Common/LoadingSpinner";
import StatusBadge from "../Common/StatusBadge";
import SectionCard from "../Common/SectionCard";
import InfoItem from "../Common/InfoItem";
import PalanqueesManager from "../Palanquee/PalanqueesManager";
import SortieRouteMap from "./SortieRouteMap";
import { formatDateTime } from "../../utils/helpers";
import { STATUT_SORTIE } from "../../utils/constants";

// Animations
const fadeInUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, ease: "easeOut" },
};

const staggerContainer = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.05,
    },
  },
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.25, ease: "easeOut" },
};

const SortieDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const canManageSortie = hasRole(["president", "moniteur"]);
  const { useGetById, useRemove, useUpdate } = useSorties();
  const { useGetBySortie } = useIncidents();
  const { useGetBySortie: useGetAttributionsBySortie } = useAttributions();
  const { useGetAll: useGetAllMateriels } = useMateriels();
  const { useGetAll: useGetAllAdherents } = useAdherents();
  const { data, isLoading } = useGetById(id);
  const { data: incidentsData } = useGetBySortie(id);
  const { data: attributionsData } = useGetAttributionsBySortie(id);
  const { data: materielsData } = useGetAllMateriels();
  const { data: adherentsData } = useGetAllAdherents();
  const remove = useRemove();
  const update = useUpdate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const sortie = data?.data;
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

  // La date de la sortie est passée mais son statut n'a pas été mis à
  // jour manuellement : on alerte le staff pour qu'il clôture/annule.
  const needsStatusUpdate =
    sortie &&
    new Date(sortie.date_heure) < new Date() &&
    [STATUT_SORTIE.PLANIFIEE, STATUT_SORTIE.EN_COURS].includes(sortie.statut);
  const isTerminee = sortie?.statut === STATUT_SORTIE.TERMINEE;

  const handleChangeStatut = async (statut) => {
    try {
      await update.mutateAsync({ id, data: { statut } });
    } catch (error) {
      // Erreur déjà notifiée via toast par le hook useUpdate
    }
  };

  const handleDelete = async () => {
    try {
      await remove.mutateAsync(id);
      navigate("/sorties");
    } catch (error) {
      // Erreur déjà notifiée via toast par le hook useRemove
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!sortie) {
    return (
      <motion.div
        variants={scaleIn}
        initial="initial"
        animate="animate"
        className="text-center py-16"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800/50 mb-6">
          <FiInfo className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
          Sortie non trouvée
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          La sortie que vous recherchez n'existe pas ou a été supprimée.
        </p>
        <button
          onClick={() => navigate("/sorties")}
          className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl transition-colors duration-150"
        >
          <FiArrowLeft className="w-4 h-4" />
          Retour à la liste
        </button>
      </motion.div>
    );
  }

  const getStatutColor = (statut) => {
    const colors = {
      [STATUT_SORTIE.PLANIFIEE]:
        "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
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
      Confirmée: FiCheckCircle,
      [STATUT_SORTIE.ANNULEE]: FiXCircle,
      [STATUT_SORTIE.TERMINEE]: FiTrendingUp,
      Reportée: FiClock,
    };
    return icons[statut] || FiCalendar;
  };

  const getStatutText = (statut) => {
    const texts = {
      [STATUT_SORTIE.PLANIFIEE]: "La sortie est planifiée et en attente",
      Confirmée: "La sortie est confirmée et prête",
      [STATUT_SORTIE.ANNULEE]: "La sortie a été annulée",
      [STATUT_SORTIE.TERMINEE]: "La sortie est terminée",
      Reportée: "La sortie a été reportée à une date ultérieure",
    };
    return texts[statut] || "Statut inconnu";
  };

  const StatutIcon = getStatutIcon(sortie.statut);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 px-4"
    >
      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-cyan-50 dark:bg-cyan-900/20">
                <FiAnchor className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
              </span>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  {sortie.type}{" "}
                  <span className="text-cyan-600 dark:text-cyan-400">
                    - {sortie.lieu}
                  </span>
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1 text-sm">
                    <FiFileText className="w-3.5 h-3.5" />
                    N°{sortie.id_sortie}
                  </span>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span className="flex items-center gap-1 text-sm">
                    <FiMapPin className="w-3.5 h-3.5" />
                    {sortie.site}
                  </span>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span className="flex items-center gap-1 text-sm">
                    <FiCalendar className="w-3.5 h-3.5" />
                    {formatDateTime(sortie.date_heure)}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
        {canManageSortie && (
          <div className="flex gap-2">
            {isTerminee ? (
              <span
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-gray-400 dark:text-gray-600 bg-gray-100 dark:bg-gray-800 rounded-xl cursor-not-allowed"
                title="Sortie terminée : déclaration d'incident impossible"
              >
                <FiAlertTriangle className="w-4 h-4" />
                Déclarer un incident
              </span>
            ) : (
              <Link
                to={`/incidents/create?id_sortie=${sortie.id_sortie}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors duration-150"
              >
                <FiAlertTriangle className="w-4 h-4" />
                Déclarer un incident
              </Link>
            )}
            {isTerminee ? (
              <span
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-gray-400 dark:text-gray-600 bg-gray-100 dark:bg-gray-800 rounded-xl cursor-not-allowed"
                title="Sortie terminée : modification impossible"
              >
                <FiEdit className="w-4 h-4" />
                Modifier
              </span>
            ) : (
              <Link
                to={`/sorties/edit/${sortie.id_sortie}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl transition-colors duration-150"
              >
                <FiEdit className="w-4 h-4" />
                Modifier
              </Link>
            )}
            <button
              onClick={() => setShowDeleteModal(true)}
              disabled={isTerminee}
              title={isTerminee ? "Sortie terminée : suppression impossible" : undefined}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiTrash2 className="w-4 h-4" />
              Supprimer
            </button>
          </div>
        )}
      </motion.div>

      {/* Alerte : la date est passée mais le statut n'a pas été mis à jour */}
      {needsStatusUpdate && canManageSortie && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border-2 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-4"
        >
          <div className="flex items-center gap-3">
            <FiAlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              Cette sortie est passée le {formatDateTime(sortie.date_heure)}
              mais son statut est toujours « {sortie.statut} ». Pensez à le
              mettre à jour.
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => handleChangeStatut("Terminée")}
              disabled={update.isPending}
              className="px-4 py-2 text-sm font-semibold text-white bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              Marquer terminée
            </button>
            <button
              onClick={() => handleChangeStatut("Annulée")}
              disabled={update.isPending}
              className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
          </div>
        </motion.div>
      )}

      {/* Carte récapitulative */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl shadow-sm p-6 md:p-8 border-2 ${getStatutColor(sortie.statut)}`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Statut de la sortie
            </p>
            <div className="flex items-center gap-4 mt-2">
              <div
                className={`p-3 rounded-full ${
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
                  className={`w-7 h-7 ${
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
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {sortie.statut}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {getStatutText(sortie.statut)}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-8 flex-wrap">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {sortie.nb_places}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Places
              </p>
            </div>
            <div className="w-px h-12 bg-gray-200 dark:bg-gray-700 hidden sm:block" />
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {sortie.profondeur_max}m
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Profondeur max
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Grille d'informations */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Informations générales */}
        <SectionCard title="Informations générales" icon={FiInfo}>
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
        </SectionCard>

        {/* Informations inscription */}
        <SectionCard title="Inscription" icon={FiUsers}>
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
        </SectionCard>
      </motion.div>

      {/* Localisation & itinéraire */}
      {sortie.latitude != null && sortie.longitude != null && (
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100/80 dark:border-gray-800/80 p-6"
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
            <span className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400">
              <FiMap className="w-5 h-5" />
            </span>
            Localisation & itinéraire
          </h3>
          <SortieRouteMap
            siteLat={Number(sortie.latitude)}
            siteLng={Number(sortie.longitude)}
            siteName={sortie.site}
          />
        </motion.div>
      )}

      {/* Sections supplémentaires */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sortie.description_site && (
          <motion.div
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100/80 dark:border-gray-800/80 p-6"
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
              <span className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400">
                <FiFileText className="w-5 h-5" />
              </span>
              Description du site
            </h3>
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {sortie.description_site}
              </p>
            </div>
          </motion.div>
        )}

        {sortie.condition_affectation && (
          <motion.div
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100/80 dark:border-gray-800/80 p-6"
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
              <span className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400">
                <FiAlertCircle className="w-5 h-5" />
              </span>
              Conditions d'affectation
            </h3>
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {sortie.condition_affectation}
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Incidents liés à cette sortie */}
      <motion.div
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100/80 dark:border-gray-800/80 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <span className="p-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
              <FiAlertTriangle className="w-5 h-5" />
            </span>
            Incidents ({incidents.length})
          </h3>
          {isTerminee ? (
            <span
              className="text-sm font-medium text-gray-400 dark:text-gray-600 cursor-not-allowed"
              title="Sortie terminée : déclaration d'incident impossible"
            >
              + Déclarer un incident
            </span>
          ) : (
            <Link
              to={`/incidents/create?id_sortie=${sortie.id_sortie}`}
              className="text-sm font-medium text-red-600 dark:text-red-400 hover:underline"
            >
              + Déclarer un incident
            </Link>
          )}
        </div>
        {incidents.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Aucun incident déclaré pour cette sortie.
          </p>
        ) : (
          <div className="space-y-2">
            {incidents.map((incident) => (
              <Link
                key={incident.id_incident}
                to={`/incidents/${incident.id_incident}`}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {incident.type}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                    {incident.description}
                  </p>
                </div>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    incident.cloture
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  }`}
                >
                  {incident.cloture ? "Clôturé" : "Non clôturé"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </motion.div>

      {/* Matériel attribué : check-list de départ/retour (CDC 3.4.3) */}
      <motion.div
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100/80 dark:border-gray-800/80 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <span className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400">
              <FiPackage className="w-5 h-5" />
            </span>
            Matériel attribué ({attributionsMateriel.length})
          </h3>
          {isTerminee ? (
            <span
              className="text-sm font-medium text-gray-400 dark:text-gray-600 cursor-not-allowed"
              title="Sortie terminée : attribution de matériel impossible"
            >
              + Attribuer du matériel
            </span>
          ) : (
            <Link
              to={`/attributions/create?id_sortie=${sortie.id_sortie}`}
              className="text-sm font-medium text-cyan-600 dark:text-cyan-400 hover:underline"
            >
              + Attribuer du matériel
            </Link>
          )}
        </div>
        {attributionsMateriel.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Aucun matériel attribué pour cette sortie.
          </p>
        ) : (
          <div className="space-y-2">
            {attributionsMateriel.map((attribution) => {
              const rendu = !!attribution.date_retour_reel;
              return (
                <Link
                  key={attribution.id_attribution}
                  to={`/attributions/${attribution.id_attribution}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {materielMap[attribution.num_inventaire] || `Matériel #${attribution.num_inventaire}`}
                      {" → "}
                      {adherentMap[attribution.num_adherent] || `Adhérent #${attribution.num_adherent}`}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Départ : {attribution.etat_depart}
                      {rendu && ` • Retour : ${attribution.etat_retour}`}
                      {attribution.constat_deterioration && " • Détérioration constatée"}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      rendu
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    }`}
                  >
                    {rendu ? "Rendu" : "En cours"}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Constitution des palanquées (moniteur / président) */}
      {canManageSortie && (
        <motion.div variants={fadeInUp} initial="initial" animate="animate">
          <PalanqueesManager sortie={sortie} />
        </motion.div>
      )}

      {/* Modal suppression */}
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
    </motion.div>
  );
};

export default SortieDetails;
