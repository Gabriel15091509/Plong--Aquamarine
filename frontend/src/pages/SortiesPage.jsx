import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiPlus,
  FiCalendar,
  FiMapPin,
  FiUsers,
  FiClock,
  FiTrendingUp,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiChevronRight,
  FiBarChart2,
  FiEye,
  FiEdit,
  FiTrash2,
  FiChevronDown,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import { useSorties } from "../hooks/useSorties";
import LoadingSpinner from "../components/Common/LoadingSpinner";
import { formatDate } from "../utils/helpers";

// ✅ Animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 30,
      delay: 0.1,
    },
  },
  hover: {
    scale: 1.02,
    boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
    transition: { type: "spring", stiffness: 400, damping: 10 },
  },
};

const SortiesPage = () => {
  const { useGetAll, useGetStats, useGetUpcoming } = useSorties();
  const [hoveredSortie, setHoveredSortie] = useState(null);

  const {
    data: sorties,
    isLoading: loadingSorties,
    error: sortiesError,
  } = useGetAll();
  const {
    data: statsData,
    isLoading: loadingStats,
    error: statsError,
  } = useGetStats();
  const {
    data: upcomingData,
    isLoading: loadingUpcoming,
    error: upcomingError,
  } = useGetUpcoming();

  const stats = useMemo(() => {
    if (!statsData?.data) {
      return { total: 0, aVenir: 0, passees: 0, annulees: 0 };
    }
    return statsData.data;
  }, [statsData]);

  const sortiesList = useMemo(() => {
    if (!sorties?.data) return [];
    return sorties.data;
  }, [sorties]);

  const upcomingSorties = useMemo(() => {
    if (!upcomingData?.data) return [];
    return upcomingData.data;
  }, [upcomingData]);

  if (loadingSorties || loadingStats || loadingUpcoming) {
    return <LoadingSpinner />;
  }

  if (sortiesError || statsError || upcomingError) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
          <FiAlertCircle className="w-8 h-8 text-red-500 dark:text-red-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Erreur de chargement
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {sortiesError?.message ||
            statsError?.message ||
            upcomingError?.message}
        </p>
      </motion.div>
    );
  }

  const statCards = [
    {
      label: "Total",
      value: stats.total || 0,
      icon: FiBarChart2,
      bgColor: "bg-gray-50 dark:bg-gray-800/50",
      iconBg: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400",
      textColor: "text-gray-900 dark:text-white",
      subTextColor: "text-gray-500 dark:text-gray-400",
      borderColor: "border-gray-200 dark:border-gray-700",
    },
    {
      label: "À venir",
      value: stats.aVenir || 0,
      icon: FiClock,
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      iconBg:
        "bg-blue-100 dark:bg-blue-800/40 text-blue-600 dark:text-blue-400",
      textColor: "text-gray-900 dark:text-white",
      subTextColor: "text-blue-600 dark:text-blue-400",
      borderColor: "border-blue-200 dark:border-blue-800/30",
    },
    {
      label: "Passées",
      value: stats.passees || 0,
      icon: FiCheckCircle,
      bgColor: "bg-green-50 dark:bg-green-900/20",
      iconBg:
        "bg-green-100 dark:bg-green-800/40 text-green-600 dark:text-green-400",
      textColor: "text-gray-900 dark:text-white",
      subTextColor: "text-green-600 dark:text-green-400",
      borderColor: "border-green-200 dark:border-green-800/30",
    },
    {
      label: "Annulées",
      value: stats.annulees || 0,
      icon: FiXCircle,
      bgColor: "bg-red-50 dark:bg-red-900/20",
      iconBg: "bg-red-100 dark:bg-red-800/40 text-red-600 dark:text-red-400",
      textColor: "text-gray-900 dark:text-white",
      subTextColor: "text-red-600 dark:text-red-400",
      borderColor: "border-red-200 dark:border-red-800/30",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* En-tête avec animation */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <motion.h1
            className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-400 dark:to-blue-400 bg-clip-text text-transparent"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            Sorties
          </motion.h1>
          <motion.p
            className="text-gray-500 dark:text-gray-400 mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Gérez toutes vos sorties de plongée
          </motion.p>
        </div>

        {/* Badge rapide */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
          className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/30 dark:to-blue-900/30 rounded-xl border border-indigo-200 dark:border-indigo-800/50"
        >
          <div className="flex items-center gap-2">
            <FiCalendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {stats.total || 0} sorties
            </span>
          </div>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
          <div className="flex items-center gap-2">
            <FiTrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {stats.aVenir || 0} à venir
            </span>
          </div>
        </motion.div>
      </motion.div>

      {/* Statistiques animées */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {statCards.map((stat, index) => {
          const Icon = stat.icon;

          return (
            <motion.div
              key={stat.label}
              variants={itemVariants}
              whileHover={{
                scale: 1.05,
                y: -5,
                transition: { type: "spring", stiffness: 400, damping: 10 },
              }}
              className={`${stat.bgColor} ${stat.borderColor} rounded-2xl p-5 border shadow-sm transition-all duration-300`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${stat.subTextColor}`}>
                    {stat.label}
                  </p>
                  <motion.p
                    className={`text-3xl font-bold ${stat.textColor} mt-1`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1 * index, type: "spring" }}
                  >
                    {stat.value}
                  </motion.p>
                </div>
                <div
                  className={`w-12 h-12 rounded-xl ${stat.iconBg} flex items-center justify-center`}
                >
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              {/* Barre de progression */}
              <motion.div
                className={`h-1 mt-3 rounded-full bg-gradient-to-r ${stat.color}`}
                initial={{ width: 0 }}
                animate={{ width: Math.min(stat.value / 5, 100) + "%" }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.8 }}
              />
            </motion.div>
          );
        })}
      </motion.div>

      {/* Liste des sorties */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700"
      >
        {sortiesList.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
              <FiCalendar className="w-10 h-10 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Aucune sortie
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Commencez par créer votre première sortie
            </p>
            <Link
              to="/sorties/create"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              <FiPlus className="w-4 h-4" />
              Créer une sortie
            </Link>
          </motion.div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {sortiesList.map((sortie, index) => {
              const isUpcoming = new Date(sortie.date_sortie) > new Date();
              const statusColors = {
                Confirmée:
                  "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800/30",
                Annulée:
                  "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/30",
                "En attente":
                  "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800/30",
                Terminée:
                  "bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-600",
              };

              return (
                <motion.div
                  key={sortie.id_sortie}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                  onHoverStart={() => setHoveredSortie(sortie.id_sortie)}
                  onHoverEnd={() => setHoveredSortie(null)}
                  className="relative p-5 hover:bg-gradient-to-r hover:from-indigo-50/50 dark:hover:from-indigo-900/10 hover:to-transparent transition-all duration-300"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Avatar/Icon */}
                      <motion.div
                        className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30 flex items-center justify-center flex-shrink-0"
                        animate={{
                          rotate:
                            hoveredSortie === sortie.id_sortie
                              ? [0, 5, -5, 0]
                              : 0,
                        }}
                        transition={{ duration: 0.5 }}
                      >
                        <FiMapPin className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      </motion.div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                            {sortie.type || "Sortie"}
                          </h3>
                          {isUpcoming && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 rounded-full"
                            >
                              <FiClock className="w-3 h-3" />À venir
                            </motion.span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <FiMapPin className="w-3 h-3" />
                            {sortie.lieu} - {sortie.site}
                          </span>
                          <span className="flex items-center gap-1">
                            <FiCalendar className="w-3 h-3" />
                            {formatDate(sortie.date_sortie)}
                          </span>
                          <span className="flex items-center gap-1">
                            <FiUsers className="w-3 h-3" />
                            {sortie.nb_places || 0} places
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full border ${statusColors[sortie.statut] || statusColors["En attente"]}`}
                      >
                        {sortie.statut || "En attente"}
                      </span>

                      <motion.div
                        className="flex gap-1"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        <Link
                          to={`/sorties/${sortie.id_sortie}`}
                          className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200"
                          title="Voir les détails"
                        >
                          <FiEye className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/sorties/edit/${sortie.id_sortie}`}
                          className="p-2 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all duration-200"
                          title="Modifier"
                        >
                          <FiEdit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => {
                            if (
                              window.confirm(
                                "Êtes-vous sûr de vouloir supprimer cette sortie ?",
                              )
                            ) {
                              // handleDelete
                            }
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                          title="Supprimer"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </motion.div>
                    </div>
                  </div>

                  {/* Barre de progression animée */}
                  <motion.div
                    className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-indigo-500 to-blue-500"
                    initial={{ width: 0 }}
                    animate={{
                      width: hoveredSortie === sortie.id_sortie ? "100%" : 0,
                    }}
                    transition={{ duration: 0.4 }}
                  />
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Animation de chargement élégante */}
      <AnimatePresence>
        {loadingSorties && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-indigo-200 dark:border-indigo-800 rounded-full animate-spin border-t-indigo-600 dark:border-t-indigo-400" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <FiBarChart2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                </div>
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300 animate-pulse">
                Chargement des sorties...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SortiesPage;
