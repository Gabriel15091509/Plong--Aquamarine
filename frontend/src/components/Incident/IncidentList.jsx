import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiEye,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiAlertTriangle,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiX,
  FiSearch,
  FiFilter,
  FiList,
  FiGrid,
  FiRefreshCw,
} from "react-icons/fi";
import toast from "react-hot-toast";
import LoadingSpinner from "../Common/LoadingSpinner";
import ModalOverlay from "../Common/ModalOverlay";
import ConfirmModal from "../Common/ConfirmModal";
import BulkActionBar from "../Common/BulkActionBar";
import Pagination from "../Common/Pagination";
import { useIncidents } from "../../hooks/Incident/useIncidents";
import { useSorties } from "../../hooks/Sortie/useSorties";
import { useSelection } from "../../hooks/useSelection";
import { formatDateTime } from "../../utils/helpers";
import incidentService from "../../services/Incident/incidentService";
import IncidentFormModal from "./IncidentFormModal";
import IncidentDetails from "./IncidentDetails";

import ErrorState from "../Common/ErrorState";

const IncidentList = () => {
  const { useGetAll, useRemove } = useIncidents();
  const { useGetAll: useGetAllSorties } = useSorties();

  const { data, isLoading, error, refetch } = useGetAll();
  const { data: sortiesData } = useGetAllSorties();
  const remove = useRemove();
  const selection = useSelection();

  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [deleteModal, setDeleteModal] = useState(null);
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  // Clé de l'action en cours (`delete-<id>`) : seule l'icône de la ligne
  // concernée passe en spinner (même motif que InscriptionList.jsx).
  const [actionLoading, setActionLoading] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  // Vue grille par défaut (cartes verticales, comme SortiesPage/AdherentList)
  // : mieux adapté au mobile que les lignes horizontales de la vue liste.
  const [viewMode, setViewMode] = useState(() =>
    typeof window !== "undefined" && window.innerWidth < 640 ? "grid" : "list",
  );

  const sortieMap = useMemo(() => {
    const map = {};
    if (sortiesData?.data) {
      sortiesData.data.forEach((s) => {
        map[s.id_sortie] = `${s.type} - ${s.lieu}`;
      });
    }
    return map;
  }, [sortiesData]);

  const allIncidents = data?.data || [];

  const filteredIncidents = useMemo(() => {
    return allIncidents.filter((i) => {
      if (filter === "clotures" && !i.cloture) return false;
      if (filter === "non-clotures" && i.cloture) return false;

      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const sortieName = (sortieMap[i.id_sortie] || "").toLowerCase();
        return (
          i.type?.toLowerCase().includes(search) ||
          i.description?.toLowerCase().includes(search) ||
          sortieName.includes(search)
        );
      }
      return true;
    });
  }, [allIncidents, sortieMap, filter, searchTerm]);

  const totalPages = Math.ceil(filteredIncidents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedIncidents = filteredIncidents.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const handleDelete = async (id) => {
    // Ferme la modale dès le lancement : elle masquerait sinon le spinner
    // de la ligne pendant la requête.
    setDeleteModal(null);
    setActionLoading(`delete-${id}`);
    try {
      await remove.mutateAsync(id);
      await refetch();
    } catch (error) {
      // toast déjà géré par le hook useRemove
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      const result = await incidentService.bulkDelete(Array.from(selection.selectedIds));
      toast[result.success ? "success" : "error"](result.message);
      selection.clear();
      refetch();
    } catch (error) {
      toast.error(error.response?.data?.message || "Erreur lors de la suppression groupée");
    } finally {
      setIsBulkDeleting(false);
      setBulkDeleteModal(false);
    }
  };

  // N'attend que la propre liste : sortiesData ne sert qu'au libellé affiché
  // (sortieMap), avec repli "Sortie #<id>" déjà prévu tant qu'elle n'est pas
  // encore chargée — chargement progressif.
  if (isLoading) return <LoadingSpinner variant="list" />;
  if (error) return <ErrorState onRetry={refetch} />;

  if (filteredIncidents.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-lg"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
          <FiAlertTriangle className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Aucun incident trouvé
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {searchTerm || filter !== "all"
            ? "Aucun résultat pour vos critères"
            : "Aucun incident déclaré pour le moment"}
        </p>
        {(searchTerm || filter !== "all") && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              setFilter("all");
            }}
            className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <FiX className="w-4 h-4" /> Réinitialiser la recherche
          </button>
        )}
        <Link
          to="/incidents/create"
          className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          <FiPlus className="w-4 h-4" /> Déclarer un incident
        </Link>
        <IncidentFormModal />
        <IncidentDetails />
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bouton "Filtres" (mobile uniquement) : recherche + filtres
          repliés par défaut pour ne pas encombrer l'écran — un tap les
          affiche. Toujours visibles à partir de sm (recherche fréquente
          sur grand écran, pas besoin de la cacher). */}
      <button
        type="button"
        onClick={() => setShowFilters((v) => !v)}
        className="sm:hidden inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
      >
        {showFilters ? <FiX className="w-4 h-4" /> : <FiFilter className="w-4 h-4" />}
        Filtres
      </button>
      <div className={`${showFilters ? "flex" : "hidden"} flex-col gap-3 sm:flex sm:flex-row`}>
        <div className="relative flex-1">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par type, description ou sortie..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white sm:w-auto"
          >
            <option value="all">Tous</option>
            <option value="non-clotures">Non clôturés</option>
            <option value="clotures">Clôturés</option>
          </select>
          {/* <Link
            to="/incidents/create"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700 sm:w-auto"
          >
            <FiPlus className="w-4 h-4" />
            Déclarer
          </Link> */}
          <div className="col-span-2 flex items-center justify-center gap-1 rounded-lg border border-gray-200 bg-gray-100 p-1 dark:border-gray-700 dark:bg-gray-800 sm:col-auto">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              title="Vue grille"
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "grid"
                  ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              }`}
            >
              <FiGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              title="Vue liste"
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "list"
                  ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              }`}
            >
              <FiList className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 px-1">
        <input
          type="checkbox"
          checked={selection.allSelected(paginatedIncidents.map((i) => i.id_incident))}
          onChange={() => selection.toggleAll(paginatedIncidents.map((i) => i.id_incident))}
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
        />
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Tout sélectionner (page courante)
        </span>
      </div>
      <BulkActionBar
        count={selection.selectedCount}
        onClear={selection.clear}
        onDelete={() => setBulkDeleteModal(true)}
      />

      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              : "grid gap-3"
          }
        >
          {viewMode === "grid"
            ? paginatedIncidents.map((incident) => (
                <motion.div
                  key={incident.id_incident}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 flex flex-col items-center text-center hover:shadow-lg transition-shadow"
                >
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center ${
                      incident.cloture
                        ? "bg-green-100 dark:bg-green-900/30"
                        : "bg-red-100 dark:bg-red-900/30"
                    }`}
                  >
                    {incident.cloture ? (
                      <FiCheckCircle className="w-7 h-7 text-green-600 dark:text-green-400" />
                    ) : (
                      <FiAlertTriangle className="w-7 h-7 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mt-3 break-words w-full">
                    {incident.type}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 truncate w-full">
                    {sortieMap[incident.id_sortie] || `Sortie #${incident.id_sortie}`}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                    {incident.description}
                  </p>
                  <p className="flex items-center justify-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <FiCalendar className="w-3.5 h-3.5 flex-shrink-0" />
                    {formatDateTime(incident.date_heure)}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2">
                    <span
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        incident.cloture
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}
                    >
                      {incident.cloture ? (
                        <>
                          <FiCheckCircle className="w-3.5 h-3.5" /> Clôturé
                        </>
                      ) : (
                        <>
                          <FiClock className="w-3.5 h-3.5" /> Non clôturé
                        </>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-1 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 w-full">
                    <input
                      type="checkbox"
                      checked={selection.isSelected(incident.id_incident)}
                      onChange={() => selection.toggle(incident.id_incident)}
                      className="mr-1 h-4 w-4 flex-shrink-0 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                      title="Sélectionner"
                    />
                    <Link
                      to={`/incidents/${incident.id_incident}`}
                      className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="Voir"
                    >
                      <FiEye className="w-4 h-4" />
                    </Link>
                    <Link
                      to={`/incidents/edit/${incident.id_incident}`}
                      className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <FiEdit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => setDeleteModal(incident.id_incident)}
                      disabled={actionLoading === `delete-${incident.id_incident}`}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                      title="Supprimer"
                    >
                      {actionLoading === `delete-${incident.id_incident}` ? (
                        <FiRefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <FiTrash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </motion.div>
              ))
            : paginatedIncidents.map((incident) => (
            <motion.div
              key={incident.id_incident}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <input
                  type="checkbox"
                  checked={selection.isSelected(incident.id_incident)}
                  onChange={() => selection.toggle(incident.id_incident)}
                  className="mt-1 h-4 w-4 flex-shrink-0 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                />
                <div className="flex-shrink-0">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      incident.cloture
                        ? "bg-green-100 dark:bg-green-900/30"
                        : "bg-red-100 dark:bg-red-900/30"
                    }`}
                  >
                    {incident.cloture ? (
                      <FiCheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                    ) : (
                      <FiAlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 dark:text-white break-words">
                          {incident.type}
                        </h3>
                        <span className="text-sm text-gray-400 dark:text-gray-500">•</span>
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {sortieMap[incident.id_sortie] || `Sortie #${incident.id_sortie}`}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                        {incident.description}
                      </p>
                      <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <FiCalendar className="w-3.5 h-3.5 flex-shrink-0" />
                          {formatDateTime(incident.date_heure)}
                        </span>
                        <span className="flex items-center gap-1">
                          {incident.cloture ? (
                            <>
                              <FiCheckCircle className="w-3.5 h-3.5 text-green-500" />
                              Clôturé
                            </>
                          ) : (
                            <>
                              <FiClock className="w-3.5 h-3.5 text-red-500" />
                              Non clôturé
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Link
                        to={`/incidents/${incident.id_incident}`}
                        className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Voir"
                      >
                        <FiEye className="w-4 h-4" />
                      </Link>
                      <Link
                        to={`/incidents/edit/${incident.id_incident}`}
                        className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <FiEdit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => setDeleteModal(incident.id_incident)}
                        disabled={actionLoading === `delete-${incident.id_incident}`}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                        title="Supprimer"
                      >
                        {actionLoading === `delete-${incident.id_incident}` ? (
                          <FiRefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <FiTrash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {deleteModal && (
        <ModalOverlay className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-4">
              <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/30">
                <FiTrash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Confirmer la suppression</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Êtes-vous sûr de vouloir supprimer cet incident ?
              <br />
              <span className="text-sm text-red-500 font-medium">
                Cette action est irréversible.
              </span>
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteModal(null)}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(deleteModal)}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors"
              >
                Supprimer
              </button>
            </div>
          </motion.div>
        </ModalOverlay>
      )}

      <ConfirmModal
        isOpen={bulkDeleteModal}
        message={`Êtes-vous sûr de vouloir supprimer les ${selection.selectedCount} incident(s) sélectionné(s) ?`}
        confirmLabel={isBulkDeleting ? "Suppression..." : "Supprimer"}
        onCancel={() => setBulkDeleteModal(false)}
        onConfirm={handleBulkDelete}
      />

      <IncidentFormModal />
      <IncidentDetails />
    </div>
  );
};

export default IncidentList;
