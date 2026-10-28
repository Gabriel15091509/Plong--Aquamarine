import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiEye,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiUsers,
  FiUser,
  FiCalendar,
  FiTag,
  FiList,
  FiGrid,
  FiMail,
  FiX,
  FiSearch,
  FiFilter,
  FiRefreshCw,
} from "react-icons/fi";
import toast from "react-hot-toast";
import LoadingSpinner from "../Common/LoadingSpinner";
import ModalOverlay from "../Common/ModalOverlay";
import ConfirmModal from "../Common/ConfirmModal";
import BulkActionBar from "../Common/BulkActionBar";
import Pagination from "../Common/Pagination";
import { useMoniteurs } from "../../hooks/Moniteur/useMoniteurs";
import { usePresidents } from "../../hooks/President/usePresidents";
import { useUsers } from "../../hooks/User/useUsers";
import { useSelection } from "../../hooks/useSelection";
import { formatDate } from "../../utils/helpers";
import { photoUrl } from "../../utils/photoUrl";
import moniteurService from "../../services/Moniteur/moniteurService";
import MoniteurFormModal from "./MoniteurFormModal";
import MoniteurDetails from "./MoniteurDetails";
import TabBar from "../Common/TabBar";
import { ROLE_TABS } from "../../constants/roleTabs";
import AccountActionsMenu from "../User/AccountActionsMenu";

import ErrorState from "../Common/ErrorState";

const toArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [value];
  } catch {
    return [value];
  }
};

const MoniteurList = () => {
  // TOUS LES HOOKS EN PREMIER - AVANT TOUT RETURN CONDITIONNEL
  const { useGetAll, useRemove } = useMoniteurs();
  const { useGetAll: useGetAllUsers } = useUsers();
  const { useGetAll: useGetAllPresidents } = usePresidents();

  const { data, isLoading, error, refetch } = useGetAll();
  const { data: usersData } = useGetAllUsers();
  const { data: presidentsData } = useGetAllPresidents();
  const remove = useRemove();
  const selection = useSelection();

  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteModal, setDeleteModal] = useState(null);
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  // Clé de l'action en cours (`delete-<id>`) : seule l'icône de la ligne
  // concernée passe en spinner (même motif que InscriptionList.jsx).
  const [actionLoading, setActionLoading] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState(() =>
    typeof window !== "undefined" && window.innerWidth < 640 ? "grid" : "list",
  );
  const itemsPerPage = 10;

  const userMap = useMemo(() => {
    const map = {};
    if (usersData?.data) {
      usersData.data.forEach((user) => {
        map[user.id] = user;
      });
    }
    return map;
  }, [usersData]);

  // Un président est nécessairement aussi moniteur (President.id_moniteur,
  // FK obligatoire — voir PresidentService.create) : sans ce filtre, il
  // apparaissait en double, une fois dans "Présidents", une fois ici. Son
  // profil moniteur (niveau, spécialités, brevet...) reste consultable
  // depuis sa fiche président — voir PresidentDetails.jsx.
  const idsMoniteursPresidents = useMemo(() => {
    return new Set(
      (presidentsData?.data || []).map((p) => p.id_moniteur),
    );
  }, [presidentsData]);

  const allMoniteurs = (data?.data || []).filter(
    (m) => !idsMoniteursPresidents.has(m.id_moniteur),
  );

  const filteredMoniteurs = useMemo(() => {
    return allMoniteurs.filter((m) => {
      const user = userMap[m.user_id];
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          m.num_brevet?.toLowerCase().includes(search) ||
          user?.name?.toLowerCase().includes(search) ||
          user?.email?.toLowerCase().includes(search) ||
          toArray(m.specialites).join(" ").toLowerCase().includes(search)
        );
      }
      return true;
    });
  }, [allMoniteurs, userMap, searchTerm]);

  const totalPages = Math.ceil(filteredMoniteurs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMoniteurs = filteredMoniteurs.slice(
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
    } catch (err) {
      console.error("Échec de la suppression du moniteur :", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      const result = await moniteurService.bulkDelete(Array.from(selection.selectedIds));
      toast[result.success ? "success" : "error"](result.message);
      selection.clear();
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur lors de la suppression groupée");
    } finally {
      setIsBulkDeleting(false);
      setBulkDeleteModal(false);
    }
  };

  // RETOUR CONDITIONNEL APRÈS TOUS LES HOOKS
  // N'attend que la propre liste : usersData ne sert qu'au nom/photo affichés
  // (userMap), avec repli "Utilisateur #<id>" déjà prévu tant qu'il n'est pas
  // encore chargé — chargement progressif.
  if (isLoading) return <LoadingSpinner variant="list" />;
  if (error) return <ErrorState onRetry={refetch} />;

  if (filteredMoniteurs.length === 0) {
    return (
      <div className="space-y-4">
        <TabBar tabs={ROLE_TABS} />
        <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-lg"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
          <FiUsers className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Aucun moniteur trouvé
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {searchTerm
            ? "Aucun résultat pour vos critères"
            : "Commencez par ajouter un nouveau moniteur"}
        </p>
        {searchTerm && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              setCurrentPage(1);
            }}
            className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <FiX className="w-4 h-4" /> Réinitialiser la recherche
          </button>
        )}
        <Link
          to="/moniteurs/create"
          className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          <FiPlus className="w-4 h-4" /> Nouveau moniteur
        </Link>
        <MoniteurFormModal />
        <MoniteurDetails />
      </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <TabBar tabs={ROLE_TABS} />
      {/* Barre de recherche */}
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
            placeholder="Rechercher par nom, email, brevet ou spécialité..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/moniteurs/create"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700 sm:flex-none"
          >
            <FiPlus className="w-4 h-4" />
            Nouveau
          </Link>
          <div className="flex shrink-0 items-center gap-1 rounded-lg border border-gray-200 bg-gray-100 p-1 dark:border-gray-700 dark:bg-gray-800">
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
          </div>
        </div>
      </div>

      {/* Sélection multiple / actions groupées */}
      <div className="flex items-center gap-2 px-1">
        <input
          type="checkbox"
          checked={selection.allSelected(paginatedMoniteurs.map((m) => m.id_moniteur))}
          onChange={() => selection.toggleAll(paginatedMoniteurs.map((m) => m.id_moniteur))}
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

      {/* Liste des moniteurs */}
      <AnimatePresence>
        {paginatedMoniteurs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
          >
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              Aucun moniteur trouvé
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                : "grid gap-3"
            }
          >
            {paginatedMoniteurs.map((moniteur) => {
              const user = userMap[moniteur.user_id];
              const specialites = toArray(moniteur.specialites);

              if (viewMode === "grid") {
                return (
                  <motion.div
                    key={moniteur.id_moniteur}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 flex flex-col items-center text-center hover:shadow-lg transition-shadow"
                  >
                    {moniteur.disponible === false && (
                      <span
                        title={
                          moniteur.cause_indisponibilite ||
                          "Indisponibilité déclarée"
                        }
                        className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                      >
                        Indisponible
                      </span>
                    )}
                    {user?.photo ? (
                      <img
                        src={photoUrl(user.photo)}
                        alt={user.name}
                        className="w-20 h-20 rounded-full object-cover border-2 border-indigo-200 dark:border-indigo-700 shadow-sm"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30 flex items-center justify-center border-2 border-indigo-200 dark:border-indigo-700 shadow-sm">
                        <FiUser className="w-9 h-9 text-indigo-500 dark:text-indigo-400" />
                      </div>
                    )}
                    <h3 className="font-semibold text-gray-900 dark:text-white mt-3 truncate w-full">
                      {user?.name || `Utilisateur #${moniteur.user_id}`}
                    </h3>
                    <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mt-0.5 truncate w-full">
                      {moniteur.num_brevet}
                      {moniteur.niveau ? ` • ${moniteur.niveau}` : ""}
                    </p>
                    {user?.email && (
                      <p className="flex items-center justify-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1 truncate w-full">
                        <FiMail className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{user.email}</span>
                      </p>
                    )}
                    {specialites.length > 0 && (
                      <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2">
                        {specialites.map((s, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                          >
                            <FiTag className="w-3 h-3" />
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-center gap-1 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 w-full">
                      <input
                        type="checkbox"
                        checked={selection.isSelected(moniteur.id_moniteur)}
                        onChange={() => selection.toggle(moniteur.id_moniteur)}
                        className="mr-1 h-4 w-4 flex-shrink-0 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                        title="Sélectionner"
                      />
                      <Link
                        to={`/moniteurs/${moniteur.id_moniteur}`}
                        className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Voir"
                      >
                        <FiEye className="w-4 h-4" />
                      </Link>
                      <Link
                        to={`/moniteurs/edit/${moniteur.id_moniteur}`}
                        className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <FiEdit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => setDeleteModal(moniteur.id_moniteur)}
                        disabled={actionLoading === `delete-${moniteur.id_moniteur}`}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                        title="Supprimer"
                      >
                        {actionLoading === `delete-${moniteur.id_moniteur}` ? (
                          <FiRefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <FiTrash2 className="w-4 h-4" />
                        )}
                      </button>
                      <AccountActionsMenu user={user} />
                    </div>
                  </motion.div>
                );
              }

              return (
                <motion.div
                  key={moniteur.id_moniteur}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={selection.isSelected(moniteur.id_moniteur)}
                      onChange={() => selection.toggle(moniteur.id_moniteur)}
                      className="mt-1 h-4 w-4 flex-shrink-0 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                    />
                    <div className="flex-shrink-0">
                      {user?.photo ? (
                        <img
                          src={photoUrl(user.photo)}
                          alt={user.name}
                          className="w-16 h-16 rounded-full object-cover border-2 border-indigo-200 dark:border-indigo-700 shadow-sm"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30 flex items-center justify-center border-2 border-indigo-200 dark:border-indigo-700 shadow-sm">
                          <FiUser className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />
                        </div>
                      )}
                      <div className="text-center mt-1">
                        <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
                          #{moniteur.id_moniteur}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-gray-900 dark:text-white break-words">
                              {user?.name || `Utilisateur #${moniteur.user_id}`}
                            </h3>
                            <span className="text-sm text-gray-400 dark:text-gray-500">
                              •
                            </span>
                            <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                              {moniteur.num_brevet}
                            </span>
                            {moniteur.niveau && (
                              <>
                                <span className="text-sm text-gray-400 dark:text-gray-500">
                                  •
                                </span>
                                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                  {moniteur.niveau}
                                </span>
                              </>
                            )}
                            {moniteur.disponible === false && (
                              <span
                                title={
                                  moniteur.cause_indisponibilite ||
                                  "Indisponibilité déclarée"
                                }
                                className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                              >
                                Indisponible
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {user?.email && <span>{user.email}</span>}
                            <span className="flex items-center gap-1">
                              <FiCalendar className="w-3.5 h-3.5" />
                              Brevet obtenu le {formatDate(moniteur.date_obtention_brevet)}
                            </span>
                          </div>
                          {specialites.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 mt-2">
                              {specialites.map((s, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                                >
                                  <FiTag className="w-3 h-3" />
                                  {s}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Link
                            to={`/moniteurs/${moniteur.id_moniteur}`}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Voir"
                          >
                            <FiEye className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/moniteurs/edit/${moniteur.id_moniteur}`}
                            className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <FiEdit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => setDeleteModal(moniteur.id_moniteur)}
                            disabled={actionLoading === `delete-${moniteur.id_moniteur}`}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                            title="Supprimer"
                          >
                            {actionLoading === `delete-${moniteur.id_moniteur}` ? (
                              <FiRefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <FiTrash2 className="w-4 h-4" />
                            )}
                          </button>
                          <AccountActionsMenu user={user} />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Modal de confirmation de suppression */}
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
              Êtes-vous sûr de vouloir supprimer ce moniteur ?
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
        message={`Êtes-vous sûr de vouloir supprimer les ${selection.selectedCount} moniteur(s) sélectionné(s) ?`}
        confirmLabel={isBulkDeleting ? "Suppression..." : "Supprimer"}
        onCancel={() => setBulkDeleteModal(false)}
        onConfirm={handleBulkDelete}
      />

      <MoniteurFormModal />
      <MoniteurDetails />
    </div>
  );
};

export default MoniteurList;
