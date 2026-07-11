import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  FiCalendar,
  FiMapPin,
  FiUsers,
  FiDroplet,
  FiClock,
  FiDollarSign,
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
} from "react-icons/fi";
import { useSorties } from "../../hooks/useSorties";
import LoadingSpinner from "../Common/LoadingSpinner";
import StatusBadge from "../Common/StatusBadge";
import { formatDateTime, formatCurrency } from "../../utils/helpers";

// Animations
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: "easeOut" },
};

const staggerContainer = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.2,
    },
  },
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.4, ease: "easeOut" },
};

const SortieDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { useGetById, useRemove } = useSorties();
  const { data, isLoading } = useGetById(id);
  const remove = useRemove();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const sortie = data?.data;

  const handleDelete = async () => {
    try {
      await remove.mutateAsync(id);
      toast.success("Sortie supprimée avec succès");
      navigate("/sorties");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
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
          className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-700 hover:via-blue-700 hover:to-indigo-700 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35"
        >
          <FiArrowLeft className="w-4 h-4" />
          Retour à la liste
        </button>
      </motion.div>
    );
  }

  const InfoItem = ({
    icon: Icon,
    label,
    value,
    highlight = false,
    children,
  }) => (
    <motion.div
      variants={fadeInUp}
      className={`flex items-start gap-4 p-4 rounded-xl transition-all duration-300 ${
        highlight
          ? "bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 border-l-4 border-blue-500"
          : "hover:bg-gray-50 dark:hover:bg-gray-800/30"
      }`}
    >
      <div
        className={`mt-0.5 p-2 rounded-lg ${
          highlight
            ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
            : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
        }`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
          {label}
        </p>
        {children || (
          <p className="font-semibold text-gray-900 dark:text-white mt-0.5">
            {value || "Non défini"}
          </p>
        )}
      </div>
    </motion.div>
  );

  const SectionCard = ({ title, icon: Icon, children, className = "" }) => (
    <motion.div
      variants={fadeInUp}
      className={`bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100/80 dark:border-gray-800/80 p-6 hover:shadow-2xl transition-shadow duration-300 ${className}`}
    >
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-3">
        <span className="p-2 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 text-blue-600 dark:text-blue-400">
          <Icon className="w-5 h-5" />
        </span>
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </motion.div>
  );

  const getStatutColor = (statut) => {
    const colors = {
      Planifiée:
        "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
      Confirmée:
        "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
      Annulée:
        "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
      Terminée:
        "bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800",
      Reportée:
        "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
    };
    return colors[statut] || colors["Planifiée"];
  };

  const getStatutIcon = (statut) => {
    const icons = {
      Planifiée: FiCalendar,
      Confirmée: FiCheckCircle,
      Annulée: FiXCircle,
      Terminée: FiTrendingUp,
      Reportée: FiClock,
    };
    return icons[statut] || FiCalendar;
  };

  const getStatutText = (statut) => {
    const texts = {
      Planifiée: "La sortie est planifiée et en attente",
      Confirmée: "La sortie est confirmée et prête",
      Annulée: "La sortie a été annulée",
      Terminée: "La sortie est terminée",
      Reportée: "La sortie a été reportée à une date ultérieure",
    };
    return texts[statut] || "Statut inconnu";
  };

  const StatutIcon = getStatutIcon(sortie.statut);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 max-w-6xl mx-auto px-4"
    >
      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
                <FiAnchor className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </span>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  {sortie.type}{" "}
                  <span className="text-blue-600 dark:text-blue-400">
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
        <div className="flex gap-2">
          <Link
            to={`/sorties/edit/${sortie.id_sortie}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-700 hover:via-blue-700 hover:to-indigo-700 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 hover:-translate-y-0.5"
          >
            <FiEdit className="w-4 h-4" />
            Modifier
          </Link>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 rounded-xl transition-all duration-300 shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/35 hover:-translate-y-0.5"
          >
            <FiTrash2 className="w-4 h-4" />
            Supprimer
          </button>
        </div>
      </motion.div>

      {/* Carte récapitulative */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl shadow-xl p-6 md:p-8 border-2 ${getStatutColor(sortie.statut)}`}
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
                    : sortie.statut === "Annulée"
                      ? "bg-red-100 dark:bg-red-900/30"
                      : sortie.statut === "Terminée"
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
                      : sortie.statut === "Annulée"
                        ? "text-red-600 dark:text-red-400"
                        : sortie.statut === "Terminée"
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
            <div className="w-px h-12 bg-gray-200 dark:bg-gray-700 hidden sm:block" />
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(sortie.tarif)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Tarif
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
        </SectionCard>

        {/* Informations financières et inscription */}
        <SectionCard title="Inscription & tarifs" icon={FiDollarSign}>
          <InfoItem
            icon={FiDollarSign}
            label="Tarif"
            value={formatCurrency(sortie.tarif)}
            highlight
          />
          <InfoItem
            icon={FiCalendar}
            label="Ouverture des inscriptions"
            value={formatDateTime(sortie.date_ouverture_inscriptions)}
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
                {sortie.nb_places} / {sortie.nb_places} places
              </span>
            }
          />
        </SectionCard>
      </motion.div>

      {/* Sections supplémentaires */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sortie.description_site && (
          <motion.div
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100/80 dark:border-gray-800/80 p-6"
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
              <span className="p-2 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 text-blue-600 dark:text-blue-400">
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
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100/80 dark:border-gray-800/80 p-6"
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
              <span className="p-2 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 text-blue-600 dark:text-blue-400">
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

      {/* Modal suppression */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", damping: 25 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-800"
          >
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-4">
              <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/30">
                <FiAlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Confirmer la suppression</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
              Êtes-vous sûr de vouloir supprimer la sortie{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {sortie.type} - {sortie.lieu}
              </span>
              ?
              <br />
              <span className="text-sm text-red-500 font-medium">
                ⚠️ Cette action est irréversible.
              </span>
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 rounded-xl transition-all duration-300 shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/35"
              >
                <FiTrash2 className="w-4 h-4 inline mr-2" />
                Confirmer la suppression
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default SortieDetails;
