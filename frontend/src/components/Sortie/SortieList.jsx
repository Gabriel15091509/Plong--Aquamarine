import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiEye,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiCalendar,
  FiMapPin,
  FiUsers,
  FiClock,
  FiChevronRight,
} from "react-icons/fi";
import { useSorties } from "../../hooks/useSorties";
import StatusBadge from "../Common/StatusBadge";
import Pagination from "../Common/Pagination";
import SearchBar from "../Common/SearchBar";
import { formatDateTime, formatCurrency } from "../../utils/helpers";

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

// ✅ Couleurs des actions
const actionColors = {
  view: {
    bg: "hover:bg-blue-50 dark:hover:bg-blue-900/20",
    text: "text-blue-600 dark:text-blue-400",
    tooltip: "Voir les détails",
  },
  edit: {
    bg: "hover:bg-emerald-50 dark:hover:bg-emerald-900/20",
    text: "text-emerald-600 dark:text-emerald-400",
    tooltip: "Modifier",
  },
  delete: {
    bg: "hover:bg-red-50 dark:hover:bg-red-900/20",
    text: "text-red-600 dark:text-red-400",
    tooltip: "Supprimer",
  },
};

// ✅ Configuration des statuts
const STATUS_CONFIG = {
  Planifiée: {
    label: "Planifiée",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800/30",
    icon: FiCalendar,
  },
  "En cours": {
    label: "En cours",
    color:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    border: "border-green-200 dark:border-green-800/30",
    icon: FiClock,
  },
  Terminée: {
    label: "Terminée",
    color: "bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-400",
    border: "border-gray-200 dark:border-gray-600",
    icon: FiCheckCircle,
  },
  Annulée: {
    label: "Annulée",
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    border: "border-red-200 dark:border-red-800/30",
    icon: FiXCircle,
  },
};

const SortieList = ({ sorties: sortiesProp }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [hoveredRow, setHoveredRow] = useState(null);
  const itemsPerPage = 10;

  const { useRemove } = useSorties();
  const remove = useRemove();

  const sortiesBase = Array.isArray(sortiesProp) ? sortiesProp : [];

  const sorties = sortiesBase.filter(
    (s) =>
      s.lieu?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.site?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.type?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalPages = Math.ceil(sorties.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSorties = sorties.slice(startIndex, startIndex + itemsPerPage);

  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette sortie ?")) {
      await remove.mutateAsync(id);
    }
  };

  if (sorties.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-lg"
      >
        <motion.div
          animate={{
            rotate: [0, 10, -10, 0],
            transition: { duration: 1, repeat: Infinity, repeatDelay: 2 },
          }}
          className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-full mb-4"
        >
          <FiCalendar className="w-10 h-10 text-indigo-500" />
        </motion.div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Aucune sortie trouvée
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {searchTerm
            ? "Aucun résultat pour votre recherche"
            : "Commencez par créer votre première sortie"}
        </p>
        <Link
          to="/sorties/create"
          className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
        >
          <FiPlus className="w-4 h-4" /> Créer une sortie
          <FiChevronRight className="w-4 h-4" />
        </Link>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
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
            placeholder="🔍 Rechercher par lieu, site, type..."
            className="transition-all duration-300 focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Link
            to="/sorties/create"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
          >
            <FiPlus className="w-4 h-4" /> Nouvelle sortie
          </Link>
        </motion.div>
      </motion.div>

      {/* Tableau */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: "spring" }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Sortie
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Lieu
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Places
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Tarif
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
                {paginatedSorties.map((sortie, index) => (
                  <motion.tr
                    key={sortie.id_sortie || sortie.id}
                    custom={index}
                    variants={tableRowVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover="hover"
                    onHoverStart={() =>
                      setHoveredRow(sortie.id_sortie || sortie.id)
                    }
                    onHoverEnd={() => setHoveredRow(null)}
                    className="transition-all duration-200"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <motion.div
                          animate={{
                            rotate:
                              hoveredRow === (sortie.id_sortie || sortie.id)
                                ? [0, 5, -5, 0]
                                : 0,
                          }}
                          transition={{ duration: 0.5 }}
                          className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center"
                        >
                          <FiMapPin className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        </motion.div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {sortie.type || "—"}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Niv. {sortie.niveau_requis || "—"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <FiCalendar className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                        {formatDateTime(sortie.date_heure)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {sortie.lieu || "—"}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {sortie.site || ""}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <FiUsers className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                        {sortie.nb_places ?? "—"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrency(sortie.tarif)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {/* ✅ Statut avec couleurs correctes */}
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border ${
                          STATUS_CONFIG[sortie.statut]?.color ||
                          "bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-400"
                        } ${
                          STATUS_CONFIG[sortie.statut]?.border ||
                          "border-gray-200 dark:border-gray-600"
                        }`}
                      >
                        {sortie.statut === "Planifiée" && "📅"}
                        {sortie.statut === "En cours" && "🔄"}
                        {sortie.statut === "Terminée" && "✅"}
                        {sortie.statut === "Annulée" && "❌"}
                        {sortie.statut || "En attente"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        {/* ✅ 1. Voir (Bleu) */}
                        <motion.div
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.85 }}
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 10,
                          }}
                        >
                          <Link
                            to={`/sorties/${sortie.id_sortie || sortie.id}`}
                            className={`p-2 ${actionColors.view.text} ${actionColors.view.bg} ${actionColors.view.darkText} ${actionColors.view.darkBg} rounded-lg transition-all duration-200 inline-flex items-center justify-center`}
                            title={actionColors.view.tooltip}
                          >
                            <FiEye className="w-4 h-4" />
                          </Link>
                        </motion.div>

                        {/* ✅ 2. Modifier (Émeraude/Vert) */}
                        <motion.div
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.85 }}
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 10,
                          }}
                        >
                          <Link
                            to={`/sorties/edit/${sortie.id_sortie || sortie.id}`}
                            className={`p-2 ${actionColors.edit.text} ${actionColors.edit.bg} ${actionColors.edit.darkText} ${actionColors.edit.darkBg} rounded-lg transition-all duration-200 inline-flex items-center justify-center`}
                            title={actionColors.edit.tooltip}
                          >
                            <FiEdit className="w-4 h-4" />
                          </Link>
                        </motion.div>

                        {/* ✅ 3. Supprimer (Rouge) */}
                        <motion.div
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.85 }}
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 10,
                          }}
                        >
                          <button
                            onClick={() =>
                              handleDelete(sortie.id_sortie || sortie.id)
                            }
                            className={`p-2 ${actionColors.delete.text} ${actionColors.delete.bg} ${actionColors.delete.darkText} ${actionColors.delete.darkBg} rounded-lg transition-all duration-200 inline-flex items-center justify-center`}
                            title={actionColors.delete.tooltip}
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </motion.div>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="border-t border-gray-200 dark:border-gray-700"
          >
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default SortieList;
