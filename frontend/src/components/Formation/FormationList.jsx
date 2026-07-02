import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  hover: {
    backgroundColor: "rgba(99, 102, 241, 0.05)",
    transition: { duration: 0.2 },
  },
};

const FormationList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState("all");
  const [hoveredRow, setHoveredRow] = useState(null);
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

  const handleDelete = async (id) => {
    if (window.confirm("Supprimer cette formation ?")) {
      await remove.mutateAsync(id);
    }
  };

  const handleComplete = async (id) => {
    if (window.confirm("Marquer cette formation comme terminée ?")) {
      await complete.mutateAsync(id);
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
      {/* Barre de recherche animée */}
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
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            <AnimatePresence>
              {paginatedFormations.map((formation, index) => {
                const formationId =
                  formation.id_formation ?? formation.id ?? index;
                const adherentName =
                  adherentMap[formation.num_adherent] ||
                  `#${formation.num_adherent}`;

                return (
                  <motion.tr
                    key={`formation-${formationId}-${index}`}
                    custom={index}
                    variants={tableRowVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover="hover"
                    onHoverStart={() => setHoveredRow(formationId)}
                    onHoverEnd={() => setHoveredRow(null)}
                    className="transition-all duration-200"
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
                            #{formation.num_adherent}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <motion.span
                        whileHover={{ scale: 1.05 }}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-800 dark:from-indigo-900/30 dark:to-blue-900/30 dark:text-indigo-400 rounded-full"
                      >
                        <FiAward className="w-3 h-3" />
                        {formation.niveau_vise}
                      </motion.span>
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
                        <motion.div
                          className="flex items-center gap-2"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.1 * index }}
                        >
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {formation.nb_seances_realisees}
                          </span>
                          <span className="text-xs text-gray-400">séances</span>
                        </motion.div>
                        {formation.statut === "En cours" && (
                          <motion.button
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() =>
                              incrementSessions.mutateAsync(formationId)
                            }
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-300 dark:text-blue-400 dark:hover:bg-blue-900/20"
                            title="Ajouter une séance"
                          >
                            <FiClock className="w-4 h-4" />
                          </motion.button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={formation.statut} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        {/* ✅ 1. Terminer (vert) - uniquement si En cours */}
                        {formation.statut === "En cours" && (
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <button
                              onClick={() => handleComplete(formationId)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200 dark:text-green-400 dark:hover:bg-green-900/20"
                              title="Terminer la formation"
                            >
                              <FiCheck className="w-4 h-4" />
                            </button>
                          </motion.div>
                        )}

                        {/* ✅ 2. Voir (bleu) - toujours visible */}
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Link
                            to={`/formations/${formationId}`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 dark:text-blue-400 dark:hover:bg-blue-900/20"
                            title="Voir les détails"
                          >
                            <FiEye className="w-4 h-4" />
                          </Link>
                        </motion.div>

                        {/* ✅ 3. Modifier (vert) - toujours visible */}
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Link
                            to={`/formations/edit/${formationId}`}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                            title="Modifier"
                          >
                            <FiEdit className="w-4 h-4" />
                          </Link>
                        </motion.div>

                        {/* ✅ 4. Supprimer (rouge) - toujours visible */}
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <button
                            onClick={() => handleDelete(formationId)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 dark:text-red-400 dark:hover:bg-red-900/20"
                            title="Supprimer"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </motion.div>
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
