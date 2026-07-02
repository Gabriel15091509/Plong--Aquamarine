import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiEye,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiCheck,
  FiX,
  FiClock,
  FiDroplet,
  FiTrendingUp,
  FiChevronRight,
} from "react-icons/fi";
import { usePlongees } from "../../hooks/usePlongees";
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
    backgroundColor: "rgba(6, 182, 212, 0.05)",
    transition: { duration: 0.2 },
  },
};

// ✅ Couleurs des actions
const actionColors = {
  validate: {
    bg: "hover:bg-emerald-50",
    text: "text-emerald-600",
    darkText: "dark:text-emerald-400",
    darkBg: "dark:hover:bg-emerald-900/20",
    tooltip: "Valider la plongée",
  },
  view: {
    bg: "hover:bg-blue-50",
    text: "text-blue-600",
    darkText: "dark:text-blue-400",
    darkBg: "dark:hover:bg-blue-900/20",
    tooltip: "Voir les détails",
  },
  edit: {
    bg: "hover:bg-cyan-50",
    text: "text-cyan-600",
    darkText: "dark:text-cyan-400",
    darkBg: "dark:hover:bg-cyan-900/20",
    tooltip: "Modifier",
  },
  delete: {
    bg: "hover:bg-red-50",
    text: "text-red-600",
    darkText: "dark:text-red-400",
    darkBg: "dark:hover:bg-red-900/20",
    tooltip: "Supprimer",
  },
};

const PlongeeList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState("all");
  const [hoveredRow, setHoveredRow] = useState(null);
  const itemsPerPage = 10;

  const { useGetAll, useRemove, useValidate } = usePlongees();
  const { useGetAll: useGetAllAdherents } = useAdherents();

  const { data, isLoading, error } = useGetAll();
  const { data: adherentsData, isLoading: loadingAdherents } =
    useGetAllAdherents();

  const remove = useRemove();
  const validate = useValidate();

  const adherentMap = useMemo(() => {
    const map = {};
    if (adherentsData?.data) {
      adherentsData.data.forEach((adherent) => {
        map[adherent.num_adherent] =
          `${adherent.civilite} ${adherent.nom} ${adherent.prenom}`;
      });
    }
    return map;
  }, [adherentsData]);

  const isLoadingData = isLoading || loadingAdherents;

  if (isLoadingData) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">Erreur: {error.message}</div>;

  let plongees = data?.data || [];

  plongees = plongees.filter((p) => {
    const adherentName = adherentMap[p.num_adherent] || "";
    const matchSearch =
      p.type_plongee?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adherentName.toLowerCase().includes(searchTerm.toLowerCase());

    if (filter === "all") return matchSearch;
    if (filter === "valide") return matchSearch && p.valide_moniteur === true;
    if (filter === "non_valide")
      return matchSearch && p.valide_moniteur === false;
    return matchSearch;
  });

  const totalPages = Math.ceil(plongees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPlongees = plongees.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette plongée ?")) {
      await remove.mutateAsync(id);
    }
  };

  const handleValidate = async (id) => {
    await validate.mutateAsync(id);
  };

  if (plongees.length === 0) {
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
          className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-full mb-4"
        >
          <FiDroplet className="w-10 h-10 text-cyan-500" />
        </motion.div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {filter === "all"
            ? "Aucune plongée enregistrée"
            : filter === "valide"
              ? "Aucune plongée validée"
              : "Aucune plongée en attente"}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Commencez par enregistrer votre première plongée
        </p>
        <Link
          to="/plongees/create"
          className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
        >
          <FiPlus className="w-4 h-4" /> Nouvelle plongée
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
            placeholder="🔍 Rechercher par adhérent ou type de plongée..."
            className="transition-all duration-300 focus:ring-2 focus:ring-cyan-500"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="input-field w-auto bg-gradient-to-r from-gray-50 to-white dark:from-gray-700 dark:to-gray-600 rounded-xl border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-cyan-500 transition-all duration-300"
          >
            <option value="all">📊 Toutes ({plongees.length})</option>
            <option value="valide">✅ Validées</option>
            <option value="non_valide">⏳ Non validées</option>
          </select>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              to="/plongees/create"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
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
              {[
                "Type",
                "Adhérent",
                "Date",
                "Profondeur",
                "Durée",
                "Validé",
                "Actions",
              ].map((h, i) => (
                <th
                  key={h}
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider"
                >
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * i }}
                  >
                    {h}
                  </motion.span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            <AnimatePresence>
              {paginatedPlongees.map((plongee, index) => {
                const adherentName =
                  adherentMap[plongee.num_adherent] ||
                  `#${plongee.num_adherent}`;

                return (
                  <motion.tr
                    key={plongee.id_plongee}
                    custom={index}
                    variants={tableRowVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover="hover"
                    onHoverStart={() => setHoveredRow(plongee.id_plongee)}
                    onHoverEnd={() => setHoveredRow(null)}
                    className="transition-all duration-200"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <motion.span
                        whileHover={{ scale: 1.05 }}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-800 dark:from-cyan-900/30 dark:to-blue-900/30 dark:text-cyan-400 rounded-full"
                      >
                        <FiDroplet className="w-3 h-3" />
                        {plongee.type_plongee}
                      </motion.span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <motion.div
                          animate={{
                            rotate:
                              hoveredRow === plongee.id_plongee
                                ? [0, 5, -5, 0]
                                : 0,
                          }}
                          transition={{ duration: 0.5 }}
                          className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center"
                        >
                          <FiTrendingUp className="w-4 h-4 text-cyan-600" />
                        </motion.div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {adherentName}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            #{plongee.num_adherent}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(plongee.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm font-medium text-gray-900 dark:text-white">
                        <FiClock className="w-3 h-3 text-gray-400" />
                        {plongee.profondeur_max}m
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {plongee.duree}min
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {plongee.valide_moniteur ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                          <FiCheck className="w-3 h-3" /> Validée
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-yellow-700 bg-yellow-100 rounded-full">
                          <FiClock className="w-3 h-3" /> En attente
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        {/* ✅ 1. Valider (admin uniquement - non validée) */}
                        {!plongee.valide_moniteur && (
                          <motion.div
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.85 }}
                          >
                            <button
                              onClick={() => handleValidate(plongee.id_plongee)}
                              className={`p-2 ${actionColors.validate.text} ${actionColors.validate.bg} ${actionColors.validate.darkText} ${actionColors.validate.darkBg} rounded-lg transition-all duration-200 inline-flex items-center justify-center`}
                              title={actionColors.validate.tooltip}
                            >
                              <FiCheck className="w-4 h-4" />
                            </button>
                          </motion.div>
                        )}

                        {/* ✅ 2. Voir (toujours visible) */}
                        <motion.div
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.85 }}
                        >
                          <Link
                            to={`/plongees/${plongee.id_plongee}`}
                            className={`p-2 ${actionColors.view.text} ${actionColors.view.bg} ${actionColors.view.darkText} ${actionColors.view.darkBg} rounded-lg transition-all duration-200 inline-flex items-center justify-center`}
                            title={actionColors.view.tooltip}
                          >
                            <FiEye className="w-4 h-4" />
                          </Link>
                        </motion.div>

                        {/* ✅ 3. Modifier (toujours visible) */}
                        <motion.div
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.85 }}
                        >
                          <Link
                            to={`/plongees/edit/${plongee.id_plongee}`}
                            className={`p-2 ${actionColors.edit.text} ${actionColors.edit.bg} ${actionColors.edit.darkText} ${actionColors.edit.darkBg} rounded-lg transition-all duration-200 inline-flex items-center justify-center`}
                            title={actionColors.edit.tooltip}
                          >
                            <FiEdit className="w-4 h-4" />
                          </Link>
                        </motion.div>

                        {/* ✅ 4. Supprimer (toujours visible) */}
                        <motion.div
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.85 }}
                        >
                          <button
                            onClick={() => handleDelete(plongee.id_plongee)}
                            className={`p-2 ${actionColors.delete.text} ${actionColors.delete.bg} ${actionColors.delete.darkText} ${actionColors.delete.darkBg} rounded-lg transition-all duration-200 inline-flex items-center justify-center`}
                            title={actionColors.delete.tooltip}
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

export default PlongeeList;
