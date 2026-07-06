import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  FiEye,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiCheck,
  FiClock,
  FiAward,
  FiCalendar,
  FiUser,
  FiChevronRight,
  FiRefreshCw,
} from "react-icons/fi";
import { useFormations } from "../../hooks/useFormations";
import { useAdherents } from "../../hooks/useAdherents";
import StatusBadge from "../Common/StatusBadge";
import Pagination from "../Common/Pagination";
import LoadingSpinner from "../Common/LoadingSpinner";
import SearchBar from "../Common/SearchBar";
import { formatDate } from "../../utils/helpers";

// ✅ Animations
const tableRowVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  }),
};

const FormationList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState("all");
  const [hoveredRow, setHoveredRow] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const itemsPerPage = 10;

  const { useGetAll, useRemove, useComplete, useIncrementSessions } =
    useFormations();
  const { useGetAll: useGetAllAdherents } = useAdherents();

  const { data, isLoading, error } = useGetAll();
  const { data: adherentsData, isLoading: loadingAdherents } =
    useGetAllAdherents();

  const remove = useRemove();
  const complete = useComplete();
  const incrementSessions = useIncrementSessions();

  const adherentMap = useMemo(() => {
    const map = {};
    const list = Array.isArray(adherentsData?.data)
      ? adherentsData.data
      : Array.isArray(adherentsData)
        ? adherentsData
        : [];
    list.forEach((a) => {
      map[a.num_adherent] =
        `${a.civilite || ""} ${a.nom || ""} ${a.prenom || ""}`.trim() ||
        `#${a.num_adherent}`;
    });
    return map;
  }, [adherentsData]);

  if (isLoading || loadingAdherents) return <LoadingSpinner />;
  if (error)
    return (
      <div className="text-center py-12 text-red-500">
        <p>Erreur: {error.message}</p>
      </div>
    );

  const allFormations = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data)
      ? data
      : [];

  const formations = allFormations.filter((f) => {
    const adherentName = adherentMap[f.num_adherent] || "";
    const matchSearch =
      adherentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.niveau_vise?.toLowerCase().includes(searchTerm.toLowerCase());
    if (filter === "all") return matchSearch;
    return matchSearch && f.statut === filter;
  });

  const totalPages = Math.ceil(formations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedFormations = formations.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const handleDelete = async (id, name) => {
    if (window.confirm(`Supprimer la formation "${name}" ?`)) {
      setActionLoading(`delete-${id}`);
      try {
        await remove.mutateAsync(id);
        toast.success("Formation supprimée avec succès");
      } catch (error) {
        toast.error("Erreur lors de la suppression");
      } finally {
        setActionLoading(null);
      }
    }
  };

  const handleComplete = async (id, name) => {
    if (window.confirm(`Marquer la formation "${name}" comme terminée ?`)) {
      setActionLoading(`complete-${id}`);
      try {
        await complete.mutateAsync(id);
        toast.success("Formation terminée avec succès");
      } catch (error) {
        toast.error("Erreur lors de la finalisation");
      } finally {
        setActionLoading(null);
      }
    }
  };

  const handleIncrementSession = async (id) => {
    setActionLoading(`session-${id}`);
    try {
      await incrementSessions.mutateAsync(id);
      toast.success("Séance ajoutée avec succès");
    } catch (error) {
      toast.error("Erreur lors de l'ajout de la séance");
    } finally {
      setActionLoading(null);
    }
  };

  if (formations.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="text-center py-16"
      >
        <motion.div
          animate={{
            rotate: [0, 10, -10, 0],
            transition: { duration: 1, repeat: Infinity, repeatDelay: 2 },
          }}
          className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-full mb-4"
        >
          <FiAward className="w-10 h-10 text-indigo-500" />
        </motion.div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {filter === "all"
            ? "Aucune formation enregistrée"
            : `Aucune formation "${filter}"`}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Commencez par créer votre première formation
        </p>
        <Link
          to="/formations/create"
          className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
        >
          <FiPlus className="w-4 h-4" /> Créer une formation
          <FiChevronRight className="w-4 h-4" />
        </Link>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Barre de recherche */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="flex-1">
          <SearchBar
            value={searchTerm}
            onChange={(val) => {
              setSearchTerm(val);
              setCurrentPage(1);
            }}
            placeholder="🔍 Rechercher par adhérent ou niveau..."
            className="transition-all duration-300 focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="input-field w-auto bg-gradient-to-r from-gray-50 to-white dark:from-gray-700 dark:to-gray-600 rounded-xl border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
          >
            <option value="all">📊 Toutes ({allFormations.length})</option>
            <option value="En cours">🔄 En cours</option>
            <option value="Terminée">✅ Terminées</option>
            <option value="Abandonnée">❌ Abandonnées</option>
            <option value="Suspendue">⏸️ Suspendues</option>
          </select>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              to="/formations/create"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
            >
              <FiPlus className="w-4 h-4" /> Nouvelle
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* Tableau */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: "spring" }}
        className="overflow-x-auto"
      >
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                Adhérent
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                Niveau
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                Période
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                Séances
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
            <AnimatePresence>
              {paginatedFormations.map((formation, index) => {
                const formationId =
                  formation.id_formation ?? formation.id ?? index;
                const adherentName =
                  adherentMap[formation.num_adherent] ||
                  `#${formation.num_adherent}`;
                const isLoading =
                  actionLoading === `delete-${formationId}` ||
                  actionLoading === `complete-${formationId}` ||
                  actionLoading === `session-${formationId}`;

                return (
                  <motion.tr
                    key={`formation-${formationId}-${index}`}
                    custom={index}
                    variants={tableRowVariants}
                    initial="hidden"
                    animate="visible"
                    onHoverStart={() => setHoveredRow(formationId)}
                    onHoverEnd={() => setHoveredRow(null)}
                    className="transition-all duration-200 hover:bg-gray-50/50 dark:hover:bg-gray-800/30"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <motion.div
                          animate={{
                            rotate:
                              hoveredRow === formationId ? [0, 5, -5, 0] : 0,
                          }}
                          transition={{ duration: 0.5 }}
                          className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center"
                        >
                          <FiUser className="w-4 h-4 text-indigo-600" />
                        </motion.div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {adherentName}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            N°{formation.num_adherent}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-800 dark:from-indigo-900/30 dark:to-blue-900/30 dark:text-indigo-400 rounded-full">
                        <FiAward className="w-3 h-3" />
                        {formation.niveau_vise}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex flex-col">
                        <span className="flex items-center gap-1">
                          <FiCalendar className="w-3 h-3 text-gray-400" />
                          {formatDate(formation.date_debut)}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <FiClock className="w-3 h-3" />
                          {formatDate(formation.date_fin_prevue)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {formation.nb_seances_realisees}
                          </span>
                          <span className="text-xs text-gray-400">séances</span>
                        </div>
                        {formation.statut === "En cours" && (
                          <motion.button
                            whileHover={{ scale: 1.2, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleIncrementSession(formationId)}
                            disabled={isLoading}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-all duration-300 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/30 disabled:opacity-50"
                            title="Ajouter une séance"
                          >
                            {isLoading ? (
                              <FiRefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <FiClock className="w-4 h-4" />
                            )}
                          </motion.button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={formation.statut} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Terminer - uniquement si En cours */}
                        {formation.statut === "En cours" && (
                          <motion.button
                            whileHover={{
                              scale: 1.15,
                              boxShadow: "0 4px 12px rgba(34, 197, 94, 0.3)",
                            }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() =>
                              handleComplete(formationId, formation.niveau_vise)
                            }
                            disabled={isLoading}
                            className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-all duration-200 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900/30 disabled:opacity-50"
                            title="Terminer la formation"
                          >
                            {actionLoading === `complete-${formationId}` ? (
                              <FiRefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <FiCheck className="w-4 h-4" />
                            )}
                          </motion.button>
                        )}

                        {/* Voir */}
                        <motion.button
                          whileHover={{
                            scale: 1.15,
                            boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
                          }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            // Rediriger vers la page de détails
                            window.location.href = `/formations/${formationId}`;
                          }}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-all duration-200 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/30"
                          title="Voir les détails"
                        >
                          <FiEye className="w-4 h-4" />
                        </motion.button>

                        {/* Modifier */}
                        <motion.button
                          whileHover={{
                            scale: 1.15,
                            boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                          }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            window.location.href = `/formations/edit/${formationId}`;
                          }}
                          className="p-2 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100 rounded-lg transition-all duration-200 dark:text-emerald-400 dark:hover:text-emerald-300 dark:hover:bg-emerald-900/30"
                          title="Modifier"
                        >
                          <FiEdit className="w-4 h-4" />
                        </motion.button>

                        {/* Supprimer */}
                        <motion.button
                          whileHover={{
                            scale: 1.15,
                            boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
                          }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() =>
                            handleDelete(formationId, formation.niveau_vise)
                          }
                          disabled={isLoading}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-all duration-200 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/30 disabled:opacity-50"
                          title="Supprimer"
                        >
                          {actionLoading === `delete-${formationId}` ? (
                            <FiRefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <FiTrash2 className="w-4 h-4" />
                          )}
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </motion.div>

      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="border-t border-gray-200 dark:border-gray-700 pt-4"
        >
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </motion.div>
      )}
    </div>
  );
};

export default FormationList;
