import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiEdit,
  FiTrash2,
  FiPlus,
  FiAward,
  FiCalendar,
  FiUser,
  FiRefreshCw,
  FiX,
  FiSearch,
  FiFilter,
  FiList,
  FiGrid,
  FiEye,
  FiCheck,
  FiXCircle,
} from "react-icons/fi";
import toast from "react-hot-toast";
import LoadingSpinner from "../Common/LoadingSpinner";
import ModalOverlay from "../Common/ModalOverlay";
import ConfirmModal from "../Common/ConfirmModal";
import BulkActionBar from "../Common/BulkActionBar";
import Pagination from "../Common/Pagination";
import { useSpecialitesFormation } from "../../hooks/Formation/useSpecialitesFormation";
import { useAdherents } from "../../hooks/Adherent/useAdherents";
import { useMoniteurs } from "../../hooks/Moniteur/useMoniteurs";
import { useSelection } from "../../hooks/useSelection";
import StatusBadge from "../Common/StatusBadge";
import { formatDate } from "../../utils/helpers";
import specialiteFormationService from "../../services/Formation/specialiteFormationService";
import SpecialiteFormationFormModal from "./SpecialiteFormationFormModal";
import SpecialiteDetails from "./SpecialiteDetails";
import TabBar from "../Common/TabBar";
import { useAuth } from "../../context/AuthContext";
import { getFormationTabs } from "../../constants/formationTabs";

import ErrorState from "../Common/ErrorState";

// Route déjà réservée président/moniteur en entier (voir App.jsx) — pas
// besoin de vérifier le rôle ici, contrairement à FormationList/BrevetList
// où la page reste ouverte à l'adhérent.

const SpecialiteFormationList = () => {
  const { user } = useAuth();
  const FORMATION_TABS = getFormationTabs(true, user?.role === "moniteur");
  const { useGetAll, useRemove, useUpdate } = useSpecialitesFormation();
  const { useGetAll: useGetAllAdherents } = useAdherents();
  const { useGetAll: useGetAllMoniteurs } = useMoniteurs();

  const { data, isLoading, error, refetch } = useGetAll();
  const { data: adherentsData } = useGetAllAdherents();
  const { data: moniteursData } = useGetAllMoniteurs();

  const remove = useRemove();
  const update = useUpdate();
  const selection = useSelection();

  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteModal, setDeleteModal] = useState(null);
  const [validerModal, setValiderModal] = useState(null);
  const [abandonnerModal, setAbandonnerModal] = useState(null);
  const [motifAbandon, setMotifAbandon] = useState("");
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  // Vue grille par défaut (cartes verticales, comme SortiesPage/AdherentList)
  // : mieux adapté au mobile que les lignes horizontales de la vue liste.
  const [viewMode, setViewMode] = useState(() =>
    typeof window !== "undefined" && window.innerWidth < 640 ? "grid" : "list",
  );

  const adherentMap = useMemo(() => {
    const map = {};
    (adherentsData?.data || []).forEach((a) => {
      map[a.num_adherent] = `${a.civilite} ${a.nom} ${a.prenom}`;
    });
    return map;
  }, [adherentsData]);

  const moniteurMap = useMemo(() => {
    const map = {};
    (moniteursData?.data || []).forEach((m) => {
      map[m.id_moniteur] = m.user?.name || `Moniteur #${m.id_moniteur}`;
    });
    return map;
  }, [moniteursData]);

  const filtered = useMemo(() => {
    const list = data?.data || [];
    if (!searchTerm) return list;
    const search = searchTerm.toLowerCase();
    return list.filter((s) => {
      const adherentName = adherentMap[s.num_adherent] || "";
      return (
        adherentName.toLowerCase().includes(search) ||
        s.type_specialite?.toLowerCase().includes(search)
      );
    });
  }, [data, adherentMap, searchTerm]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

  // N'attend que la propre liste : adherentsData/moniteursData ne servent
  // qu'aux noms affichés (adherentMap/moniteurMap), avec repli "#<id>" déjà
  // prévu tant qu'ils ne sont pas encore chargés — chargement progressif.
  if (isLoading) return <LoadingSpinner variant="list" />;
  if (error) return <ErrorState onRetry={refetch} />;

  const handleDelete = async (id) => {
    try {
      setActionLoading(id);
      await remove.mutateAsync(id);
      setDeleteModal(null);
    } catch (err) {
      console.error("Échec de la suppression de la spécialité :", err);
    } finally {
      setActionLoading(null);
    }
  };

  // "Valider"/"Ne pas valider" : simple passage par la mise à jour générique
  // (statut "Terminée"/"Abandonnée"), verrouillée côté serveur dès qu'elle est
  // franchie une fois (voir FormationSpecialiteService.assertSpecialiteModifiable)
  // — pas de route dédiée nécessaire, contrairement à FormationService.
  // completeFormation, qui doit d'abord vérifier séances/compétences (aucun
  // sous-critère équivalent ici).
  const handleValider = async (id) => {
    try {
      setActionLoading(id);
      await update.mutateAsync({ id, data: { statut: "Terminée" } });
      setValiderModal(null);
    } catch (err) {
      console.error("Échec de la validation de la spécialité :", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAbandonner = async (id) => {
    try {
      setActionLoading(id);
      await update.mutateAsync({
        id,
        data: { statut: "Abandonnée", commentaire: motifAbandon.trim() || undefined },
      });
      setAbandonnerModal(null);
      setMotifAbandon("");
    } catch (err) {
      console.error("Échec de l'abandon de la spécialité :", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      const result = await specialiteFormationService.bulkDelete(Array.from(selection.selectedIds));
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

  if (filtered.length === 0) {
    return (
      <div className="space-y-4">
        <TabBar tabs={FORMATION_TABS} />
        <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-lg"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
          <FiAward className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Aucune spécialité trouvée
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {searchTerm
            ? "Aucun résultat pour votre recherche"
            : "Commencez par inscrire un adhérent à une spécialité"}
        </p>
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm("")}
            className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <FiX className="w-4 h-4" /> Réinitialiser la recherche
          </button>
        )}
        <Link
          to="/specialites-formation/create"
          className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          <FiPlus className="w-4 h-4" /> Nouvelle spécialité
        </Link>
        <SpecialiteFormationFormModal />
        <SpecialiteDetails />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <TabBar tabs={FORMATION_TABS} />
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
            placeholder="Rechercher par adhérent ou spécialité..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <Link
          to="/specialites-formation/create"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700 sm:w-auto"
        >
          <FiPlus className="w-4 h-4" />
          Nouvelle
        </Link>
        <div className="flex items-center justify-center gap-1 rounded-lg border border-gray-200 bg-gray-100 p-1 dark:border-gray-700 dark:bg-gray-800">
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

      <div className="flex items-center gap-2 px-1">
        <input
          type="checkbox"
          checked={selection.allSelected(paginated.map((s) => s.id_specialite_formation))}
          onChange={() => selection.toggleAll(paginated.map((s) => s.id_specialite_formation))}
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
            ? paginated.map((specialite) => {
                const specialiteId = specialite.id_specialite_formation;
                const adherentName =
                  adherentMap[specialite.num_adherent] || `#${specialite.num_adherent}`;
                const moniteurName =
                  moniteurMap[specialite.id_moniteur] || `#${specialite.id_moniteur}`;
                // "Terminée"/"Abandonnée" : parcours clos, verrouillé côté
                // serveur (voir FormationSpecialiteService.
                // assertSpecialiteModifiable) — même principe que
                // FormationList.jsx (isCloturee).
                const isCloturee =
                  specialite.statut === "Terminée" || specialite.statut === "Abandonnée";

                return (
                  <motion.div
                    key={specialiteId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 flex flex-col items-center text-center hover:shadow-lg transition-shadow"
                  >
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30 flex items-center justify-center border-2 border-indigo-200 dark:border-indigo-700 shadow-sm">
                      <FiUser className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mt-3 break-words w-full">
                      {adherentName}
                    </h3>
                    <p className="flex items-center justify-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400">
                      <FiAward className="w-3.5 h-3.5" />
                      {specialite.type_specialite}
                    </p>
                    <p className="flex items-center justify-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <FiCalendar className="w-3.5 h-3.5 flex-shrink-0" />
                      {formatDate(specialite.date_debut)}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Moniteur : {moniteurName}
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2">
                      <StatusBadge status={specialite.statut} />
                    </div>
                    <div className="flex items-center justify-center gap-1 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 w-full">
                      {!isCloturee && (
                        <input
                          type="checkbox"
                          checked={selection.isSelected(specialiteId)}
                          onChange={() => selection.toggle(specialiteId)}
                          className="mr-1 h-4 w-4 flex-shrink-0 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                          title="Sélectionner"
                        />
                      )}
                      {!isCloturee && (
                        <>
                          <button
                            onClick={() => setValiderModal(specialiteId)}
                            disabled={actionLoading === specialiteId}
                            className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50"
                            title="Valider (Terminée)"
                          >
                            <FiCheck className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setAbandonnerModal(specialiteId)}
                            disabled={actionLoading === specialiteId}
                            className="p-2 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-lg transition-colors disabled:opacity-50"
                            title="Ne pas valider (Abandonnée)"
                          >
                            <FiXCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <Link
                        to={`/specialites-formation/${specialiteId}`}
                        className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Voir"
                      >
                        <FiEye className="w-4 h-4" />
                      </Link>
                      {isCloturee ? (
                        <span
                          className="p-2 text-gray-300 dark:text-gray-600 cursor-not-allowed"
                          title="Spécialité terminée ou abandonnée : modification impossible"
                        >
                          <FiEdit className="w-4 h-4" />
                        </span>
                      ) : (
                        <Link
                          to={`/specialites-formation/edit/${specialiteId}`}
                          className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <FiEdit className="w-4 h-4" />
                        </Link>
                      )}
                      <button
                        onClick={() => setDeleteModal(specialiteId)}
                        disabled={actionLoading === specialiteId || isCloturee}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={
                          isCloturee
                            ? "Spécialité terminée ou abandonnée : suppression impossible"
                            : "Supprimer"
                        }
                      >
                        {actionLoading === specialiteId ? (
                          <FiRefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <FiTrash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </motion.div>
                );
              })
            : paginated.map((specialite) => {
            const specialiteId = specialite.id_specialite_formation;
            const adherentName = adherentMap[specialite.num_adherent] || `#${specialite.num_adherent}`;
            const moniteurName = moniteurMap[specialite.id_moniteur] || `#${specialite.id_moniteur}`;
            const isCloturee =
              specialite.statut === "Terminée" || specialite.statut === "Abandonnée";

            return (
              <motion.div
                key={specialiteId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  {!isCloturee && (
                    <input
                      type="checkbox"
                      checked={selection.isSelected(specialiteId)}
                      onChange={() => selection.toggle(specialiteId)}
                      className="mt-1 h-4 w-4 flex-shrink-0 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                    />
                  )}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30 flex items-center justify-center border-2 border-indigo-200 dark:border-indigo-700 shadow-sm flex-shrink-0">
                    <FiUser className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900 dark:text-white break-words">
                            {adherentName}
                          </h3>
                          <span className="text-sm text-gray-400 dark:text-gray-500">•</span>
                          <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                            <FiAward className="w-3.5 h-3.5" />
                            {specialite.type_specialite}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <FiCalendar className="w-3.5 h-3.5 flex-shrink-0" />
                            {formatDate(specialite.date_debut)}
                          </span>
                          <span className="flex flex-wrap items-center gap-2">
                            <span>Moniteur : {moniteurName}</span>
                            <StatusBadge status={specialite.statut} />
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!isCloturee && (
                          <>
                            <button
                              onClick={() => setValiderModal(specialiteId)}
                              disabled={actionLoading === specialiteId}
                              className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50"
                              title="Valider (Terminée)"
                            >
                              <FiCheck className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setAbandonnerModal(specialiteId)}
                              disabled={actionLoading === specialiteId}
                              className="p-2 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-lg transition-colors disabled:opacity-50"
                              title="Ne pas valider (Abandonnée)"
                            >
                              <FiXCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <Link
                          to={`/specialites-formation/${specialiteId}`}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Voir"
                        >
                          <FiEye className="w-4 h-4" />
                        </Link>
                        {isCloturee ? (
                          <span
                            className="p-2 text-gray-300 dark:text-gray-600 cursor-not-allowed"
                            title="Spécialité terminée ou abandonnée : modification impossible"
                          >
                            <FiEdit className="w-4 h-4" />
                          </span>
                        ) : (
                          <Link
                            to={`/specialites-formation/edit/${specialiteId}`}
                            className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <FiEdit className="w-4 h-4" />
                          </Link>
                        )}
                        <button
                          onClick={() => setDeleteModal(specialiteId)}
                          disabled={actionLoading === specialiteId || isCloturee}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title={
                            isCloturee
                              ? "Spécialité terminée ou abandonnée : suppression impossible"
                              : "Supprimer"
                          }
                        >
                          {actionLoading === specialiteId ? (
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
            );
          })}
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
              Êtes-vous sûr de vouloir supprimer cette spécialité ?
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
        message={`Êtes-vous sûr de vouloir supprimer les ${selection.selectedCount} spécialité(s) sélectionnée(s) ?`}
        confirmLabel={isBulkDeleting ? "Suppression..." : "Supprimer"}
        onCancel={() => setBulkDeleteModal(false)}
        onConfirm={handleBulkDelete}
      />

      {/* Modal de confirmation de validation — même structure que le modal
          "Terminer la formation" de FormationList.jsx, réduite ici : aucun
          sous-critère à vérifier avant de valider une spécialité. */}
      {validerModal && (
        <ModalOverlay className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            <div className="flex items-center gap-3 text-green-600 dark:text-green-400 mb-4">
              <div className="p-2 rounded-xl bg-green-100 dark:bg-green-900/30">
                <FiCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Valider la spécialité</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              La spécialité sera marquée &quot;Terminée&quot; et ne sera plus
              modifiable.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setValiderModal(null)}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => handleValider(validerModal)}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors"
              >
                Valider
              </button>
            </div>
          </motion.div>
        </ModalOverlay>
      )}

      {/* Modal de confirmation d'abandon — même principe que le modal
          "Ajourner la formation" de FormationList.jsx (motif requis). */}
      {abandonnerModal && (
        <ModalOverlay className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            <div className="flex items-center gap-3 text-pink-600 dark:text-pink-400 mb-4">
              <div className="p-2 rounded-xl bg-pink-100 dark:bg-pink-900/30">
                <FiXCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Ne pas valider la spécialité</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-3">
              La spécialité sera marquée &quot;Abandonnée&quot; et ne sera plus
              modifiable. Indiquez le motif :
            </p>
            <textarea
              value={motifAbandon}
              onChange={(e) => setMotifAbandon(e.target.value)}
              rows="4"
              className="w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-200 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white mb-6"
              placeholder="Ex : niveau insuffisant sur les exercices Nitrox, à refaire..."
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setAbandonnerModal(null);
                  setMotifAbandon("");
                }}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => handleAbandonner(abandonnerModal)}
                disabled={!motifAbandon.trim()}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-pink-600 hover:bg-pink-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Abandonner
              </button>
            </div>
          </motion.div>
        </ModalOverlay>
      )}

      <SpecialiteFormationFormModal />
      <SpecialiteDetails />
    </div>
  );
};

export default SpecialiteFormationList;
