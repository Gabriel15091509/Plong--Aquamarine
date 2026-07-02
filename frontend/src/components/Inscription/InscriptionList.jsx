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
  FiX,
  FiFilter,
  FiClipboard,
  FiUsers,
  FiCalendar,
  FiClock,
  FiChevronRight,
} from "react-icons/fi";
import { useInscriptions } from "../../hooks/useInscriptions";
import { useAdherents } from "../../hooks/useAdherents";
import { useSorties } from "../../hooks/useSorties";
import { useAuth } from "../../context/AuthContext";
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
    backgroundColor: "rgba(99, 102, 241, 0.03)",
    transition: { duration: 0.2 },
  },
};

// ✅ Couleurs des actions
const actionColors = {
  pointage: {
    bg: "hover:bg-indigo-50 dark:hover:bg-indigo-900/20",
    text: "text-indigo-600 dark:text-indigo-400",
    tooltip: "Gérer le pointage",
  },
  confirm: {
    bg: "hover:bg-emerald-50 dark:hover:bg-emerald-900/20",
    text: "text-emerald-600 dark:text-emerald-400",
    tooltip: "Confirmer",
  },
  cancel: {
    bg: "hover:bg-orange-50 dark:hover:bg-orange-900/20",
    text: "text-orange-600 dark:text-orange-400",
    tooltip: "Annuler",
  },
  view: {
    bg: "hover:bg-blue-50 dark:hover:bg-blue-900/20",
    text: "text-blue-600 dark:text-blue-400",
    tooltip: "Voir les détails",
  },
  delete: {
    bg: "hover:bg-red-50 dark:hover:bg-red-900/20",
    text: "text-red-600 dark:text-red-400",
    tooltip: "Supprimer",
  },
};

const InscriptionList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState("all");
  const [filterSortie, setFilterSortie] = useState("all");
  const [loading, setLoading] = useState(false);
  const [hoveredRow, setHoveredRow] = useState(null);
  const itemsPerPage = 10;

  const { user } = useAuth();
  const isAdherent = user?.role === "adherent";
  const isAdmin = ["president", "moniteur", "tresorier"].includes(user?.role);

  const { useGetAll, useRemove, useConfirm, useCancel, useUpdate } =
    useInscriptions();
  const { useGetAll: useGetAllAdherents } = useAdherents();
  const { useGetAll: useGetAllSorties } = useSorties();

  const { data, isLoading, error, refetch } = useGetAll();
  const { data: adherentsData, isLoading: loadingAdherents } =
    useGetAllAdherents();
  const { data: sortiesData, isLoading: loadingSorties } = useGetAllSorties();

  const remove = useRemove();
  const confirm = useConfirm();
  const cancel = useCancel();
  const updateInscription = useUpdate();

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

  const currentAdherent = useMemo(() => {
    if (!adherentsData?.data || !user) return null;
    return adherentsData.data.find((adherent) => adherent.email === user.email);
  }, [adherentsData, user]);

  const sortieMap = useMemo(() => {
    const map = {};
    if (sortiesData?.data) {
      sortiesData.data.forEach((sortie) => {
        map[sortie.id_sortie] = {
          label: `${sortie.type} - ${sortie.lieu} (${sortie.site})`,
          date: sortie.date_sortie,
          type: sortie.type,
          id: sortie.id_sortie,
        };
      });
    }
    return map;
  }, [sortiesData]);

  const sortieOptions = useMemo(() => {
    const options = [{ value: "all", label: "Toutes les sorties" }];
    if (sortiesData?.data) {
      sortiesData.data.forEach((sortie) => {
        options.push({
          value: sortie.id_sortie.toString(),
          label: `${sortie.type} - ${sortie.lieu} (${new Date(sortie.date_sortie).toLocaleDateString("fr-FR")})`,
        });
      });
    }
    return options;
  }, [sortiesData]);

  const allInscriptions = data?.data || [];

  const filteredByRole = useMemo(() => {
    if (isAdmin) {
      return allInscriptions;
    } else if (isAdherent && currentAdherent) {
      return allInscriptions.filter(
        (i) => i.num_adherent === currentAdherent.num_adherent,
      );
    }
    return [];
  }, [allInscriptions, isAdmin, isAdherent, currentAdherent]);

  const filteredInscriptions = filteredByRole.filter((i) => {
    const adherentName = adherentMap[i.num_adherent] || "";
    const sortieName = sortieMap[i.id_sortie]?.label || "";
    const matchSearch =
      adherentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sortieName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus = filter === "all" || i.statut === filter;
    const matchSortie =
      filterSortie === "all" || i.id_sortie.toString() === filterSortie;

    return matchSearch && matchStatus && matchSortie;
  });

  const stats = useMemo(() => {
    const counts = {
      total: filteredInscriptions.length,
      attente: filteredInscriptions.filter((i) => i.statut === "En attente")
        .length,
      confirmee: filteredInscriptions.filter((i) => i.statut === "Confirmée")
        .length,
      annulee: filteredInscriptions.filter((i) => i.statut === "Annulée")
        .length,
      listeAttente: filteredInscriptions.filter(
        (i) => i.statut === "Liste d'attente",
      ).length,
      present: filteredInscriptions.filter(
        (i) => i.presence && i.presence_checked,
      ).length,
      absent: filteredInscriptions.filter(
        (i) => !i.presence && i.presence_checked,
      ).length,
      nonPointes: filteredInscriptions.filter((i) => !i.presence_checked)
        .length,
    };
    return counts;
  }, [filteredInscriptions]);

  const totalPages = Math.ceil(filteredInscriptions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedInscriptions = filteredInscriptions.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const handleSortieChange = (newSortie) => {
    setFilterSortie(newSortie);
    setCurrentPage(1);
  };

  const handleSearchChange = (newSearch) => {
    setSearchTerm(newSearch);
    setCurrentPage(1);
  };

  const handleDelete = async (id) => {
    if (!isAdmin) {
      toast.error("Vous n'avez pas les droits pour supprimer une inscription");
      return;
    }
    setLoading(true);
    try {
      await remove.mutateAsync(id);
      toast.success("Inscription supprimée avec succès");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id) => {
    if (!isAdmin) {
      toast.error("Seul un moniteur ou le président peut confirmer");
      return;
    }
    setLoading(true);
    try {
      await confirm.mutateAsync(id);
      toast.success("Inscription confirmée avec succès");
    } catch (error) {
      toast.error("Erreur lors de la confirmation");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    setLoading(true);
    try {
      await cancel.mutateAsync(id);
      toast.success("Inscription annulée avec succès");
    } catch (error) {
      toast.error("Erreur lors de l'annulation");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="text-red-500">Erreur: {error.message}</div>;
  }

  return (
    <div className="space-y-4 p-4">
      {/* ✅ Message pour les adhérents */}
      {isAdherent && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-blue-600 dark:text-blue-400 text-lg">ℹ️</span>
            <div>
              <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
                Vos inscriptions
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Vous voyez uniquement vos propres inscriptions. Vous pouvez
                annuler une inscription en attente ou confirmée.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Message pour les admins */}
      {isAdmin && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-green-600 dark:text-green-400 text-lg">
              👑
            </span>
            <div>
              <p className="text-sm text-green-800 dark:text-green-300 font-medium">
                Gestion des inscriptions
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                Vous avez accès à toutes les inscriptions. Vous pouvez
                confirmer, annuler ou supprimer des inscriptions.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Barre de filtres */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <SearchBar
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder={
              isAdherent
                ? "Rechercher dans vos inscriptions..."
                : "Rechercher par adhérent ou sortie..."
            }
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={filter}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="input-field w-auto min-w-[140px]"
          >
            <option value="all">Tous les statuts</option>
            <option value="En attente">En attente ({stats.attente})</option>
            <option value="Confirmée">Confirmées ({stats.confirmee})</option>
            <option value="Annulée">Annulées ({stats.annulee})</option>
            <option value="Liste d'attente">
              Liste d'attente ({stats.listeAttente})
            </option>
          </select>

          <select
            value={filterSortie}
            onChange={(e) => handleSortieChange(e.target.value)}
            className="input-field w-auto min-w-[180px]"
          >
            {sortieOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {isAdmin && (
            <Link
              to="/inscriptions/create"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <FiPlus className="w-4 h-4" /> Nouvelle
            </Link>
          )}
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="flex flex-wrap gap-2 text-sm">
        {[
          {
            label: isAdherent ? "Vos inscriptions" : "Total",
            value: stats.total,
          },
          { label: "En attente", value: stats.attente },
          { label: "Confirmées", value: stats.confirmee },
          { label: "Annulées", value: stats.annulee },
          { label: "Liste d'attente", value: stats.listeAttente },
          { label: "Présents", value: stats.present },
          { label: "Absents", value: stats.absent },
          { label: "Non pointés", value: stats.nonPointes },
        ].map((stat, index) => (
          <span
            key={stat.label}
            className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400"
          >
            {stat.label}: <strong>{stat.value}</strong>
          </span>
        ))}
        {filterSortie !== "all" && (
          <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full flex items-center gap-1">
            {sortieMap[parseInt(filterSortie)]?.label || "Sortie sélectionnée"}
            <button
              onClick={() => handleSortieChange("all")}
              className="ml-1 hover:text-indigo-600"
            >
              <FiX className="w-3 h-3" />
            </button>
          </span>
        )}
      </div>

      {/* Tableau */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
              <tr>
                {["Adhérent", "Sortie", "Date", "Présence", "Statut", ""].map(
                  (h, i) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {paginatedInscriptions.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-4 py-12 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <FiX className="w-12 h-12 text-gray-300" />
                      <p>
                        {isAdherent
                          ? "Vous n'avez pas encore d'inscription"
                          : "Aucune inscription trouvée"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedInscriptions.map((inscription, index) => {
                  const adherentName =
                    adherentMap[inscription.num_adherent] ||
                    `#${inscription.num_adherent}`;
                  const sortieInfo = sortieMap[inscription.id_sortie] || {
                    label: `#${inscription.id_sortie}`,
                  };

                  const isOwnInscription =
                    isAdherent &&
                    currentAdherent &&
                    inscription.num_adherent === currentAdherent.num_adherent;

                  return (
                    <motion.tr
                      key={inscription.id_inscription}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-medium text-xs">
                            {adherentName.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {adherentName}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              #{inscription.num_adherent}
                              {isOwnInscription && (
                                <span className="ml-2 text-blue-600 font-medium">
                                  (Vous)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {sortieInfo.label}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          #{inscription.id_sortie}
                          {sortieInfo.date && (
                            <> • {formatDate(sortieInfo.date)}</>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(inscription.date_inscription)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {inscription.presence_checked ? (
                          inscription.presence ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                              <FiCheck className="w-3 h-3" /> Présent
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400 rounded-full">
                              <FiX className="w-3 h-3" /> Absent
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-full">
                            <FiClock className="w-3 h-3" /> Non pointé
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={inscription.statut} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-0.5">
                          {/* ✅ 1. Pointage (admin uniquement) */}
                          {isAdmin && (
                            <Link
                              to={`/sorties/${inscription.id_sortie}/pointage`}
                              className={`p-1.5 ${actionColors.pointage.text} ${actionColors.pointage.bg} rounded-lg transition-colors`}
                              title={actionColors.pointage.tooltip}
                            >
                              <FiClipboard className="w-4 h-4" />
                            </Link>
                          )}

                          {/* ✅ 2. Confirmer (admin - En attente) */}
                          {isAdmin && inscription.statut === "En attente" && (
                            <button
                              onClick={() =>
                                handleConfirm(inscription.id_inscription)
                              }
                              disabled={loading}
                              className={`p-1.5 ${actionColors.confirm.text} ${actionColors.confirm.bg} rounded-lg transition-colors disabled:opacity-50`}
                              title={actionColors.confirm.tooltip}
                            >
                              <FiCheck className="w-4 h-4" />
                            </button>
                          )}

                          {/* ✅ 3. Annuler (admin ou propriétaire) */}
                          {(inscription.statut === "En attente" ||
                            inscription.statut === "Confirmée") &&
                            (isAdmin || isOwnInscription) && (
                              <button
                                onClick={() =>
                                  handleCancel(inscription.id_inscription)
                                }
                                disabled={loading}
                                className={`p-1.5 ${actionColors.cancel.text} ${actionColors.cancel.bg} rounded-lg transition-colors disabled:opacity-50`}
                                title={actionColors.cancel.tooltip}
                              >
                                <FiX className="w-4 h-4" />
                              </button>
                            )}

                          {/* ✅ 4. Voir */}
                          <Link
                            to={`/inscriptions/${inscription.id_inscription}`}
                            className={`p-1.5 ${actionColors.view.text} ${actionColors.view.bg} rounded-lg transition-colors`}
                            title={actionColors.view.tooltip}
                          >
                            <FiEye className="w-4 h-4" />
                          </Link>

                          {/* ✅ 5. Supprimer (admin uniquement) */}
                          {isAdmin && (
                            <button
                              onClick={() =>
                                handleDelete(inscription.id_inscription)
                              }
                              disabled={loading}
                              className={`p-1.5 ${actionColors.delete.text} ${actionColors.delete.bg} rounded-lg transition-colors disabled:opacity-50`}
                              title={actionColors.delete.tooltip}
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          )}
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
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default InscriptionList;
