import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
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
  FiBarChart2,
  FiEye,
  FiEdit,
  FiTrash2,
  FiSearch,
  FiDollarSign,
  FiFilter,
  FiX,
} from "react-icons/fi";
import { useSorties } from "../hooks/useSorties";
import LoadingSpinner from "../components/Common/LoadingSpinner";
import Pagination from "../components/Common/Pagination";
import { formatDate } from "../utils/helpers";
import StatusBadge from "../components/Common/StatusBadge";

// ✅ Configuration des statuts de sortie
const SORTIE_STATUS = [
  { value: "all", label: "📊 Tous les statuts" },
  { value: "Planifiée", label: "📅 Planifiée" },
  { value: "En cours", label: "🔄 En cours" },
  { value: "Terminée", label: "✅ Terminée" },
  { value: "Annulée", label: "❌ Annulée" },
];

const SortiesPage = () => {
  const { useGetAll, useGetStats } = useSorties();
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  // ✅ Statistiques réelles depuis l'API
  const stats = useMemo(() => {
    if (statsData?.data) {
      if (
        typeof statsData.data === "object" &&
        !Array.isArray(statsData.data)
      ) {
        return {
          total: statsData.data.total || 0,
          planifiees: statsData.data.planifiees || statsData.data.aVenir || 0,
          enCours: statsData.data.enCours || 0,
          terminees: statsData.data.terminees || statsData.data.passees || 0,
          annulees: statsData.data.annulees || 0,
        };
      }
    }

    const sortiesList = sorties?.data || [];
    const total = sortiesList.length;
    const planifiees = sortiesList.filter(
      (s) => s.statut === "Planifiée",
    ).length;
    const enCours = sortiesList.filter((s) => s.statut === "En cours").length;
    const terminees = sortiesList.filter((s) => s.statut === "Terminée").length;
    const annulees = sortiesList.filter((s) => s.statut === "Annulée").length;

    return { total, planifiees, enCours, terminees, annulees };
  }, [statsData, sorties]);

  const sortiesList = useMemo(() => {
    if (!sorties?.data) return [];
    return sorties.data;
  }, [sorties]);

  // ✅ Filtrage
  const filteredSorties = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return sortiesList.filter((sortie) => {
      const searchable = [
        sortie.type,
        sortie.lieu,
        sortie.site,
        sortie.statut,
        sortie.niveau_requis,
      ];
      const matchSearch =
        !normalizedSearch ||
        searchable.some((val) =>
          String(val || "")
            .toLowerCase()
            .includes(normalizedSearch),
        );

      const matchFilter = filter === "all" || sortie.statut === filter;

      return matchSearch && matchFilter;
    });
  }, [sortiesList, searchTerm, filter]);

  // ✅ Pagination
  const totalPages = Math.ceil(filteredSorties.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSorties = filteredSorties.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  // ✅ Gestion des filtres
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const handleSearchChange = (newSearch) => {
    setSearchTerm(newSearch);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilter("all");
    setCurrentPage(1);
  };

  // ✅ Statistiques détaillées
  const sortieStats = useMemo(() => {
    const total = sortiesList.length;
    const planifiees = sortiesList.filter(
      (s) => s.statut === "Planifiée",
    ).length;
    const enCours = sortiesList.filter((s) => s.statut === "En cours").length;
    const terminees = sortiesList.filter((s) => s.statut === "Terminée").length;
    const annulees = sortiesList.filter((s) => s.statut === "Annulée").length;
    return { total, planifiees, enCours, terminees, annulees };
  }, [sortiesList]);

  if (loadingSorties || loadingStats) return <LoadingSpinner />;

  if (sortiesError || statsError) {
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
          {sortiesError?.message || statsError?.message}
        </p>
      </motion.div>
    );
  }

  // ✅ 5 STATISTIQUES SUR UNE MÊME LIGNE
  const statCards = [
    {
      label: "Total",
      value: stats.total || 0,
      icon: FiBarChart2,
      color: "indigo",
      bg: "bg-indigo-50 dark:bg-indigo-900/20",
      iconBg:
        "bg-indigo-100 dark:bg-indigo-800/40 text-indigo-600 dark:text-indigo-400",
      border: "border-indigo-200 dark:border-indigo-800/30",
    },
    {
      label: "Planifiées",
      value: stats.planifiees || 0,
      icon: FiCalendar,
      color: "blue",
      bg: "bg-blue-50 dark:bg-blue-900/20",
      iconBg:
        "bg-blue-100 dark:bg-blue-800/40 text-blue-600 dark:text-blue-400",
      border: "border-blue-200 dark:border-blue-800/30",
    },
    {
      label: "En cours",
      value: stats.enCours || 0,
      icon: FiClock,
      color: "green",
      bg: "bg-green-50 dark:bg-green-900/20",
      iconBg:
        "bg-green-100 dark:bg-green-800/40 text-green-600 dark:text-green-400",
      border: "border-green-200 dark:border-green-800/30",
    },
    {
      label: "Terminées",
      value: stats.terminees || 0,
      icon: FiCheckCircle,
      color: "gray",
      bg: "bg-gray-50 dark:bg-gray-800/50",
      iconBg: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400",
      border: "border-gray-200 dark:border-gray-700",
    },
    {
      label: "Annulées",
      value: stats.annulees || 0,
      icon: FiXCircle,
      color: "red",
      bg: "bg-red-50 dark:bg-red-900/20",
      iconBg: "bg-red-100 dark:bg-red-800/40 text-red-600 dark:text-red-400",
      border: "border-red-200 dark:border-red-800/30",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* En-tête animé */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-400 dark:to-blue-400 bg-clip-text text-transparent"
          >
            Sorties
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-gray-500 dark:text-gray-400 mt-1"
          >
            Gérez toutes vos sorties de plongée
          </motion.p>
        </div>

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
              {stats.planifiees || 0} planifiées
            </span>
          </div>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
          <div className="flex items-center gap-2">
            <FiCheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {stats.enCours || 0} en cours
            </span>
          </div>
        </motion.div>
      </motion.div>

      {/* Bouton Nouvelle sortie */}
      <div className="flex justify-end">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link
            to="/sorties/create"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-sm font-medium rounded-xl hover:shadow-lg transition-all duration-300"
          >
            <FiPlus className="w-4 h-4" />
            Nouvelle sortie
          </Link>
        </motion.div>
      </div>

      {/* ✅ 5 STATISTIQUES SUR UNE MÊME LIGNE */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              whileHover={{
                scale: 1.03,
                y: -3,
                transition: { type: "spring", stiffness: 400, damping: 10 },
              }}
              className={`${stat.bg} ${stat.border} rounded-xl border p-3 transition-all shadow-sm hover:shadow-md`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {stat.label}
                  </p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`w-8 h-8 rounded-lg ${stat.iconBg} flex items-center justify-center`}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              {/* ✅ Barre de progression fine */}
              <motion.div
                className={`h-0.5 mt-2 rounded-full bg-gradient-to-r ${stat.color === "indigo" ? "from-indigo-500 to-indigo-600" : stat.color === "blue" ? "from-blue-500 to-blue-600" : stat.color === "green" ? "from-green-500 to-green-600" : stat.color === "gray" ? "from-gray-400 to-gray-500" : "from-red-500 to-red-600"}`}
                initial={{ width: 0 }}
                animate={{
                  width:
                    stats.total > 0
                      ? `${(stat.value / stats.total) * 100}%`
                      : "0%",
                }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.8 }}
              />
            </motion.div>
          );
        })}
      </div>

      {/* Barre de recherche et filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Rechercher une sortie..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <FiX className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={filter}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 min-w-[160px]"
          >
            {SORTIE_STATUS.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>

          {(searchTerm || filter !== "all") && (
            <button
              onClick={clearFilters}
              className="px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-1"
            >
              <FiX className="w-4 h-4" />
              Effacer
            </button>
          )}

          <span className="flex items-center text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
            {filteredSorties.length} résultat
            {filteredSorties.length > 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Liste des sorties */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Sortie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Lieu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Places
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedSorties.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <FiCalendar className="w-12 h-12 text-gray-300" />
                      <p>Aucune sortie trouvée</p>
                      {(searchTerm || filter !== "all") && (
                        <button
                          onClick={clearFilters}
                          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                          Réinitialiser les filtres
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedSorties.map((sortie, index) => {
                  const isUpcoming = new Date(sortie.date_heure) > new Date();

                  return (
                    <motion.tr
                      key={sortie.id_sortie}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                            <FiMapPin className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {sortie.type || "Sortie"}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Niv. {sortie.niveau_requis || "—"}
                              {isUpcoming && (
                                <span className="ml-2 text-blue-600 dark:text-blue-400 font-medium">
                                  À venir
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(sortie.date_heure)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {sortie.lieu || "—"}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {sortie.site || ""}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {sortie.nb_places ?? "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={sortie.statut} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-1">
                          <Link
                            to={`/sorties/${sortie.id_sortie}`}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Voir"
                          >
                            <FiEye className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/sorties/edit/${sortie.id_sortie}`}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <FiEdit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => {
                              if (window.confirm("Supprimer cette sortie ?")) {
                                // handleDelete
                              }
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default SortiesPage;
