import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiEye,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiTool,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiX,
  FiSearch,
  FiFilter,
  FiList,
  FiGrid,
  FiRefreshCw,
} from "react-icons/fi";
import toast from "react-hot-toast";
import LoadingSpinner from "../Common/LoadingSpinner";
import ConfirmModal from "../Common/ConfirmModal";
import BulkActionBar from "../Common/BulkActionBar";
import Pagination from "../Common/Pagination";
import { useReparations } from "../../hooks/Reparation/useReparations";
import { useMateriels } from "../../hooks/Materiel/useMateriels";
import { useSelection } from "../../hooks/useSelection";
import { formatDate, formatCurrency } from "../../utils/helpers";
import reparationService from "../../services/Reparation/reparationService";
import ReparationFormModal from "./ReparationFormModal";
import ReparationDetails from "./ReparationDetails";
import TabBar from "../Common/TabBar";
import { MATERIEL_TABS } from "../../constants/materielTabs";

import ErrorState from "../Common/ErrorState";

const ReparationList = () => {
  const { useGetAll, useRemove } = useReparations();
  const { useGetAll: useGetAllMateriels } = useMateriels();

  const { data, isLoading, error, refetch } = useGetAll();
  const { data: materielsData } =
    useGetAllMateriels();
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

  const materielMap = useMemo(() => {
    const map = {};
    materielsData?.data?.forEach((m) => {
      map[m.num_inventaire] = `${m.marque} ${m.modele}`;
    });
    return map;
  }, [materielsData]);

  const allReparations = data?.data || [];

  const filteredReparations = useMemo(() => {
    return allReparations.filter((r) => {
      const isEnCours = !r.date_retour;
      if (filter === "en-cours" && !isEnCours) return false;
      if (filter === "terminees" && isEnCours) return false;

      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const materielName = (materielMap[r.num_inventaire] || "").toLowerCase();
        return (
          materielName.includes(search) ||
          r.prestataire?.toLowerCase().includes(search) ||
          r.description_panne?.toLowerCase().includes(search)
        );
      }
      return true;
    });
  }, [allReparations, materielMap, filter, searchTerm]);

  // Regroupement par matériel (même principe que AdhesionList, regroupé par
  // adhérent) : les réparations d'un même matériel doivent apparaître
  // ensemble à l'affichage — ça suppose qu'elles soient déjà contiguës dans
  // la liste, d'où ce tri par nom de matériel (alphabétique), puis par date
  // de constat la plus récente en premier au sein d'un même matériel
  // (historique de pannes successives sur le même équipement).
  const sortedReparations = useMemo(() => {
    return [...filteredReparations].sort((a, b) => {
      const nameA = (
        materielMap[a.num_inventaire] || `Matériel #${a.num_inventaire}`
      ).toLowerCase();
      const nameB = (
        materielMap[b.num_inventaire] || `Matériel #${b.num_inventaire}`
      ).toLowerCase();
      const cmp = nameA.localeCompare(nameB, "fr");
      if (cmp !== 0) return cmp;
      return new Date(b.date_constat || 0) - new Date(a.date_constat || 0);
    });
  }, [filteredReparations, materielMap]);

  const totalPages = Math.ceil(sortedReparations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedReparations = sortedReparations.slice(
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
      const result = await reparationService.bulkDelete(Array.from(selection.selectedIds));
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

  // N'attend que la propre liste : materielsData ne sert qu'au libellé
  // affiché (materielMap), avec repli "Matériel #<num_inventaire>" déjà
  // prévu tant qu'il n'est pas encore chargé — chargement progressif.
  if (isLoading) return <LoadingSpinner variant="list" />;
  if (error) return <ErrorState onRetry={refetch} />;

  if (filteredReparations.length === 0) {
    return (
      <div className="space-y-4">
        <TabBar tabs={MATERIEL_TABS} />
        <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-lg"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
          <FiTool className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Aucune réparation trouvée
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {searchTerm || filter !== "all"
            ? "Aucun résultat pour vos critères"
            : "Commencez par déclarer une nouvelle réparation"}
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
          to="/reparations/create"
          className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          <FiPlus className="w-4 h-4" /> Nouvelle réparation
        </Link>
        <ReparationFormModal />
        <ReparationDetails />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <TabBar tabs={MATERIEL_TABS} />
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
            placeholder="Rechercher par matériel, prestataire ou panne..."
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
            <option value="all">Toutes</option>
            <option value="en-cours">En cours</option>
            <option value="terminees">Terminées</option>
          </select>
          <Link
            to="/reparations/create"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700 sm:w-auto"
          >
            <FiPlus className="w-4 h-4" />
            Nouvelle
          </Link>
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
          checked={selection.allSelected(paginatedReparations.map((r) => r.id_reparation))}
          onChange={() => selection.toggleAll(paginatedReparations.map((r) => r.id_reparation))}
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
          {(() => {
            // En-tête de groupe seulement s'il y a plus d'un matériel sur la
            // page courante — avec un seul groupe (ex. recherche déjà ciblée
            // sur un matériel), un unique en-tête ne ferait que répéter ce
            // qu'affiche déjà le contexte. paginatedReparations est trié par
            // matériel (voir sortedReparations plus haut), donc un même
            // matériel y est toujours contigu : comparer au précédent
            // suffit à détecter chaque changement de groupe. Fonction
            // partagée entre les deux modes d'affichage (grille/liste)
            // ci-dessous — même logique, même en-tête.
            const showGroupHeaders =
              new Set(paginatedReparations.map((r) => r.num_inventaire)).size >
              1;
            let previousNumInventaire;
            const renderGroupHeader = (reparation, materielName) => {
              const isNewGroup =
                showGroupHeaders &&
                reparation.num_inventaire !== previousNumInventaire;
              previousNumInventaire = reparation.num_inventaire;
              if (!isNewGroup) return null;
              return (
                <div className="col-span-full flex items-center gap-2 px-1 pt-4 mt-1 border-t border-gray-100 dark:border-gray-700 first:mt-0 first:pt-0 first:border-t-0">
                  <FiTool className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                    {materielName}
                  </h3>
                </div>
              );
            };

            return viewMode === "grid"
            ? paginatedReparations.map((reparation) => {
                const isEnCours = !reparation.date_retour;
                const materielName =
                  materielMap[reparation.num_inventaire] ||
                  `Matériel #${reparation.num_inventaire}`;
                const groupHeader = renderGroupHeader(reparation, materielName);
                return (
                  <React.Fragment key={reparation.id_reparation}>
                  {groupHeader}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 flex flex-col items-center text-center hover:shadow-lg transition-shadow"
                  >
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center ${
                        isEnCours
                          ? "bg-orange-100 dark:bg-orange-900/30"
                          : "bg-green-100 dark:bg-green-900/30"
                      }`}
                    >
                      {isEnCours ? (
                        <FiClock className="w-7 h-7 text-orange-600 dark:text-orange-400" />
                      ) : (
                        <FiCheckCircle className="w-7 h-7 text-green-600 dark:text-green-400" />
                      )}
                    </div>
                    <h3 className="font-semibold text-indigo-700 dark:text-indigo-400 mt-3 break-words w-full">
                      {reparation.prestataire}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {reparation.description_panne}
                    </p>
                    <p className="flex items-center justify-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <FiCalendar className="w-3.5 h-3.5 flex-shrink-0" />
                      {formatDate(reparation.date_constat)}
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2">
                      {reparation.cout && (
                        <span className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                          <FiDollarSign className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                          {formatCurrency(reparation.cout)}
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          isEnCours
                            ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                            : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        }`}
                      >
                        {isEnCours ? "En cours" : "Terminée"}
                      </span>
                    </div>
                    <div className="flex items-center justify-center gap-1 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 w-full">
                      <input
                        type="checkbox"
                        checked={selection.isSelected(reparation.id_reparation)}
                        onChange={() => selection.toggle(reparation.id_reparation)}
                        className="mr-1 h-4 w-4 flex-shrink-0 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                        title="Sélectionner"
                      />
                      <Link
                        to={`/reparations/${reparation.id_reparation}`}
                        className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Voir"
                      >
                        <FiEye className="w-4 h-4" />
                      </Link>
                      <Link
                        to={`/reparations/edit/${reparation.id_reparation}`}
                        className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <FiEdit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => setDeleteModal(reparation.id_reparation)}
                        disabled={actionLoading === `delete-${reparation.id_reparation}`}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                        title="Supprimer"
                      >
                        {actionLoading === `delete-${reparation.id_reparation}` ? (
                          <FiRefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <FiTrash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </motion.div>
                  </React.Fragment>
                );
              })
            : paginatedReparations.map((reparation) => {
            const isEnCours = !reparation.date_retour;
            const materielName =
              materielMap[reparation.num_inventaire] ||
              `Matériel #${reparation.num_inventaire}`;
            const groupHeader = renderGroupHeader(reparation, materielName);
            return (
              <React.Fragment key={reparation.id_reparation}>
              {groupHeader}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={selection.isSelected(reparation.id_reparation)}
                    onChange={() => selection.toggle(reparation.id_reparation)}
                    className="mt-1 h-4 w-4 flex-shrink-0 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                  />
                  <div className="flex-shrink-0">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isEnCours
                          ? "bg-orange-100 dark:bg-orange-900/30"
                          : "bg-green-100 dark:bg-green-900/30"
                      }`}
                    >
                      {isEnCours ? (
                        <FiClock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                      ) : (
                        <FiCheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-indigo-700 dark:text-indigo-400 break-words">
                            {reparation.prestataire}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                          {reparation.description_panne}
                        </p>
                        <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <FiCalendar className="w-3.5 h-3.5 flex-shrink-0" />
                            {formatDate(reparation.date_constat)}
                          </span>
                          <span className="flex flex-wrap items-center gap-2">
                            {reparation.cout && (
                              <span className="flex items-center gap-1 font-medium text-gray-700 dark:text-gray-300">
                                <FiDollarSign className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                                {formatCurrency(reparation.cout)}
                              </span>
                            )}
                            <span>{isEnCours ? "En cours" : "Terminée"}</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Link
                          to={`/reparations/${reparation.id_reparation}`}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Voir"
                        >
                          <FiEye className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/reparations/edit/${reparation.id_reparation}`}
                          className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <FiEdit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setDeleteModal(reparation.id_reparation)}
                          disabled={actionLoading === `delete-${reparation.id_reparation}`}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                          title="Supprimer"
                        >
                          {actionLoading === `delete-${reparation.id_reparation}` ? (
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
              </React.Fragment>
            );
          });
          })()}
        </motion.div>
      </AnimatePresence>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      <ConfirmModal
        isOpen={!!deleteModal}
        message="Êtes-vous sûr de vouloir supprimer cette réparation ?"
        onCancel={() => setDeleteModal(null)}
        onConfirm={() => handleDelete(deleteModal)}
      />

      <ConfirmModal
        isOpen={bulkDeleteModal}
        message={`Êtes-vous sûr de vouloir supprimer les ${selection.selectedCount} réparation(s) sélectionnée(s) ?`}
        confirmLabel={isBulkDeleting ? "Suppression..." : "Supprimer"}
        onCancel={() => setBulkDeleteModal(false)}
        onConfirm={handleBulkDelete}
      />

      <ReparationFormModal />
      <ReparationDetails />
    </div>
  );
};

export default ReparationList;
