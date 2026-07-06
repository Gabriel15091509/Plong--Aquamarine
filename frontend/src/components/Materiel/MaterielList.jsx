import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiEye,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiTool,
  FiBox,
  FiSearch,
  FiX,
  FiChevronRight,
} from "react-icons/fi";
import { useMateriels } from "../../hooks/useMateriels";
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
    backgroundColor: "rgba(59, 130, 246, 0.05)",
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
    bg: "hover:bg-cyan-50 dark:hover:bg-cyan-900/20",
    text: "text-cyan-600 dark:text-cyan-400",
    tooltip: "Modifier",
  },
  delete: {
    bg: "hover:bg-red-50 dark:hover:bg-red-900/20",
    text: "text-red-600 dark:text-red-400",
    tooltip: "Supprimer",
  },
};

const MaterielList = () => {
  // ✅ TOUS LES HOOKS EN PREMIER
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState("all");
  const [hoveredRow, setHoveredRow] = useState(null);
  const itemsPerPage = 10;

  const { useGetAll, useRemove } = useMateriels();
  const { data, isLoading, error } = useGetAll();
  const remove = useRemove();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">Erreur: {error.message}</div>;

  let materiels = data?.data || [];

  materiels = materiels.filter((m) => {
    const matchSearch =
      m.marque?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.modele?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.num_inventaire?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.categorie?.toLowerCase().includes(searchTerm.toLowerCase());
    if (filter === "all") return matchSearch;
    return matchSearch && m.etat === filter;
  });

  const totalPages = Math.ceil(materiels.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMateriels = materiels.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const handleDelete = async (numInventaire) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce matériel ?")) {
      await remove.mutateAsync(numInventaire);
    }
  };

  const getEtatColor = (etat) => {
    const colors = {
      Neuf: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
      Bon: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
      Usagé:
        "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
      "À réparer":
        "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400",
      "Hors service":
        "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
    };
    return (
      colors[etat] ||
      "bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-400"
    );
  };

  // ✅ Statistiques
  const stats = {
    total: materiels.length,
    disponible: materiels.filter((m) => m.etat === "Neuf" || m.etat === "Bon")
      .length,
    enReparation: materiels.filter((m) => m.etat === "À réparer").length,
    horsService: materiels.filter((m) => m.etat === "Hors service").length,
  };

  if (materiels.length === 0) {
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
          className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-full mb-4"
        >
          <FiTool className="w-10 h-10 text-blue-500 dark:text-blue-400" />
        </motion.div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {searchTerm || filter !== "all"
            ? "Aucun matériel trouvé"
            : "Aucun matériel enregistré"}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {searchTerm || filter !== "all"
            ? "Essayez de modifier vos critères de recherche"
            : "Commencez par ajouter votre premier équipement"}
        </p>
        {!searchTerm && filter === "all" && (
          <Link
            to="/materiels/create"
            className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
          >
            <FiPlus className="w-4 h-4" /> Nouveau matériel
            <FiChevronRight className="w-4 h-4" />
          </Link>
        )}
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
            placeholder="🔍 Rechercher par numéro, marque, modèle, catégorie..."
            className="transition-all duration-300 focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="input-field w-auto bg-gradient-to-r from-gray-50 to-white dark:from-gray-700 dark:to-gray-600 rounded-xl border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 transition-all duration-300"
          >
            <option value="all">📊 Tous ({stats.total})</option>
            <option value="Neuf">🆕 Neuf</option>
            <option value="Bon">✅ Bon</option>
            <option value="Usagé">🔄 Usagé</option>
            <option value="À réparer">🔧 À réparer</option>
            <option value="Hors service">❌ Hors service</option>
          </select>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              to="/materiels/create"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
            >
              <FiPlus className="w-4 h-4" /> Nouveau
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* Statistiques rapides */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex flex-wrap gap-2 text-sm"
      >
        <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300">
          Total: <strong>{stats.total}</strong>
        </span>
        <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full">
          ✅ Disponible: <strong>{stats.disponible}</strong>
        </span>
        <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full">
          🔧 En réparation: <strong>{stats.enReparation}</strong>
        </span>
        <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full">
          ❌ Hors service: <strong>{stats.horsService}</strong>
        </span>
        {searchTerm && (
          <span className="px-3 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 rounded-full">
            🔍 "{searchTerm}"
          </span>
        )}
        {filter !== "all" && (
          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
            📌 {filter}
          </span>
        )}
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
                "N° Inventaire",
                "Catégorie",
                "Marque / Modèle",
                "État",
                "Localisation",
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
              {paginatedMateriels.map((materiel, index) => (
                <motion.tr
                  key={materiel.num_inventaire}
                  custom={index}
                  variants={tableRowVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                  onHoverStart={() => setHoveredRow(materiel.num_inventaire)}
                  onHoverEnd={() => setHoveredRow(null)}
                  className="transition-all duration-200"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <motion.div
                        animate={{
                          rotate:
                            hoveredRow === materiel.num_inventaire
                              ? [0, 5, -5, 0]
                              : 0,
                        }}
                        transition={{ duration: 0.5 }}
                        className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 flex items-center justify-center"
                      >
                        <FiBox className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </motion.div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {materiel.num_inventaire}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium bg-gradient-to-r from-purple-100 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30 text-purple-800 dark:text-purple-400 rounded-full">
                      <FiTool className="w-3 h-3" />
                      {materiel.categorie}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {materiel.marque}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {materiel.modele}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${getEtatColor(materiel.etat)}`}
                    >
                      {materiel.etat}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {materiel.localisation || "—"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      {/* ✅ 1. Voir */}
                      <motion.div
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.85 }}
                      >
                        <Link
                          to={`/materiels/${materiel.num_inventaire}`}
                          className={`p-2 ${actionColors.view.text} ${actionColors.view.bg} rounded-lg transition-all duration-200 inline-flex items-center justify-center`}
                          title={actionColors.view.tooltip}
                        >
                          <FiEye className="w-4 h-4" />
                        </Link>
                      </motion.div>

                      {/* ✅ 2. Modifier */}
                      <motion.div
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.85 }}
                      >
                        <Link
                          to={`/materiels/edit/${materiel.num_inventaire}`}
                          className={`p-2 ${actionColors.edit.text} ${actionColors.edit.bg} rounded-lg transition-all duration-200 inline-flex items-center justify-center`}
                          title={actionColors.edit.tooltip}
                        >
                          <FiEdit className="w-4 h-4" />
                        </Link>
                      </motion.div>

                      {/* ✅ 3. Supprimer */}
                      <motion.div
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.85 }}
                      >
                        <button
                          onClick={() => handleDelete(materiel.num_inventaire)}
                          className={`p-2 ${actionColors.delete.text} ${actionColors.delete.bg} rounded-lg transition-all duration-200 inline-flex items-center justify-center`}
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

export default MaterielList;
