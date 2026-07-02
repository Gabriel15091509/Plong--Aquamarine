import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiEye,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiX,
  FiFileText,
  FiUser,
  FiDollarSign,
  FiCalendar,
  FiChevronRight,
  FiCreditCard,
  FiTrendingUp,
} from "react-icons/fi";
import { useAdhesions } from "../../hooks/useAdhesions";
import { useAdherents } from "../../hooks/useAdherents";
import StatusBadge from "../Common/StatusBadge";
import Pagination from "../Common/Pagination";
import LoadingSpinner from "../Common/LoadingSpinner";
import SearchBar from "../Common/SearchBar";
import { formatDate, formatCurrency } from "../../utils/helpers";

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
    backgroundColor: "rgba(16, 185, 129, 0.05)",
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

const AdhesionList = () => {
  // ✅ TOUS LES HOOKS EN PREMIER
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState("all");
  const [hoveredRow, setHoveredRow] = useState(null);
  const itemsPerPage = 10;

  const { useGetAll, useRemove } = useAdhesions();
  const { useGetAll: useGetAllAdherents } = useAdherents();

  const { data, isLoading, error } = useGetAll();
  const { data: adherentsData, isLoading: loadingAdherents } =
    useGetAllAdherents();

  const remove = useRemove();

  // ✅ TOUS LES useMemo AVANT LE RETURN CONDITIONNEL
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

  // ✅ Calcul des adhésions filtrées (même si loading)
  const allAdhesions = data?.data || [];

  const filteredAdhesions = useMemo(() => {
    return allAdhesions.filter((a) => {
      const adherentName = adherentMap[a.num_adherent] || "";
      const matchSearch =
        a.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.num_licence_ffesm?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        adherentName.toLowerCase().includes(searchTerm.toLowerCase());
      if (filter === "all") return matchSearch;
      return matchSearch && a.statut_paiement === filter;
    });
  }, [allAdhesions, adherentMap, searchTerm, filter]);

  // ✅ Statistiques (calculées même si loading)
  const stats = useMemo(() => {
    const total = filteredAdhesions.length;
    const payes = filteredAdhesions.filter(
      (a) => a.statut_paiement === "Payé",
    ).length;
    const enAttente = filteredAdhesions.filter(
      (a) => a.statut_paiement === "En attente",
    ).length;
    const partiels = filteredAdhesions.filter(
      (a) => a.statut_paiement === "Partiel",
    ).length;
    const annules = filteredAdhesions.filter(
      (a) => a.statut_paiement === "Annulé",
    ).length;
    return { total, payes, enAttente, partiels, annules };
  }, [filteredAdhesions]);

  // ✅ Pagination
  const totalPages = Math.ceil(filteredAdhesions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAdhesions = filteredAdhesions.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  // ✅ Fonctions
  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette adhésion ?")) {
      await remove.mutateAsync(id);
    }
  };

  // ✅ RETOUR CONDITIONNEL APRÈS TOUS LES HOOKS
  const isLoadingData = isLoading || loadingAdherents;
  if (isLoadingData) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">Erreur: {error.message}</div>;

  if (filteredAdhesions.length === 0) {
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
          className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-full mb-4"
        >
          <FiFileText className="w-10 h-10 text-emerald-500 dark:text-emerald-400" />
        </motion.div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Aucune adhésion trouvée
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {searchTerm || filter !== "all"
            ? "Essayez de modifier vos critères de recherche"
            : "Commencez par créer une nouvelle adhésion"}
        </p>
        {(searchTerm || filter !== "all") && (
          <button
            onClick={() => {
              setSearchTerm("");
              setFilter("all");
              setCurrentPage(1);
            }}
            className="mt-4 text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-medium"
          >
            Réinitialiser les filtres
          </button>
        )}
        {!searchTerm && filter === "all" && (
          <Link
            to="/adhesions/create"
            className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
          >
            <FiPlus className="w-4 h-4" /> Nouvelle adhésion
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
            placeholder="🔍 Rechercher par adhérent, type ou licence..."
            className="transition-all duration-300 focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="input-field w-auto bg-gradient-to-r from-gray-50 to-white dark:from-gray-700 dark:to-gray-600 rounded-xl border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 transition-all duration-300"
          >
            <option value="all">📊 Tous ({stats.total})</option>
            <option value="Payé">✅ Payés ({stats.payes})</option>
            <option value="En attente">
              ⏳ En attente ({stats.enAttente})
            </option>
            <option value="Partiel">🔄 Partiels ({stats.partiels})</option>
            <option value="Annulé">❌ Annulés ({stats.annules})</option>
          </select>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              to="/adhesions/create"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
            >
              <FiPlus className="w-4 h-4" /> Nouvelle
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
        <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
          ✅ Payés: <strong>{stats.payes}</strong>
        </span>
        <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full">
          ⏳ En attente: <strong>{stats.enAttente}</strong>
        </span>
        <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full">
          🔄 Partiels: <strong>{stats.partiels}</strong>
        </span>
        <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full">
          ❌ Annulés: <strong>{stats.annules}</strong>
        </span>
        {searchTerm && (
          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
            🔍 "{searchTerm}"
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
                "Type",
                "Adhérent",
                "Période",
                "Montant",
                "Statut",
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
              {paginatedAdhesions.map((adhesion, index) => {
                const adherentName =
                  adherentMap[adhesion.num_adherent] ||
                  `#${adhesion.num_adherent}`;

                return (
                  <motion.tr
                    key={adhesion.id_adhesion}
                    custom={index}
                    variants={tableRowVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover="hover"
                    onHoverStart={() => setHoveredRow(adhesion.id_adhesion)}
                    onHoverEnd={() => setHoveredRow(null)}
                    className="transition-all duration-200"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <motion.span
                          whileHover={{ scale: 1.05 }}
                          className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 text-emerald-800 dark:text-emerald-400 rounded-full"
                        >
                          <FiFileText className="w-3 h-3" />
                          {adhesion.type}
                        </motion.span>
                        {adhesion.num_licence_ffesm && (
                          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            Licence: {adhesion.num_licence_ffesm}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <motion.div
                          animate={{
                            rotate:
                              hoveredRow === adhesion.id_adhesion
                                ? [0, 5, -5, 0]
                                : 0,
                          }}
                          transition={{ duration: 0.5 }}
                          className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center"
                        >
                          <FiUser className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </motion.div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {adherentName}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            #{adhesion.num_adherent}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex flex-col">
                        <span className="flex items-center gap-1">
                          <FiCalendar className="w-3 h-3 text-gray-400" />
                          {formatDate(adhesion.date_debut)}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5">
                          <FiCalendar className="w-3 h-3" />
                          {formatDate(adhesion.date_fin)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-900 dark:text-white">
                        <FiDollarSign className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                        {formatCurrency(adhesion.montant_paye)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={adhesion.statut_paiement} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        {/* ✅ 1. Voir */}
                        <motion.div
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.85 }}
                        >
                          <Link
                            to={`/adhesions/${adhesion.id_adhesion}`}
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
                            to={`/adhesions/edit/${adhesion.id_adhesion}`}
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
                            onClick={() => handleDelete(adhesion.id_adhesion)}
                            className={`p-2 ${actionColors.delete.text} ${actionColors.delete.bg} rounded-lg transition-all duration-200 inline-flex items-center justify-center`}
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

export default AdhesionList;
