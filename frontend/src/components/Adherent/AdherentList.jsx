import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiEye,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiUser,
  FiMail,
  FiPhone,
  FiCalendar,
  FiAward,
  FiSend,
  FiList,
  FiGrid,
  FiX,
  FiSearch,
} from "react-icons/fi";
import LoadingSpinner from "../Common/LoadingSpinner";
import ConfirmModal from "../Common/ConfirmModal";
import { useAdherents } from "../../hooks/Adherent/useAdherents";
import { useAuth } from "../../context/AuthContext";
import StatusBadge from "../Common/StatusBadge";
import { photoUrl } from "../../utils/photoUrl";
import { STATUT_ADHERENT_OPTIONS } from "../../utils/constants";

import ErrorState from "../Common/ErrorState";

// TODO: Ajouter un filtre par date d'inscription
const AdherentList = () => {
  const { hasRole } = useAuth();
  const canManageAdherent = hasRole(["president"]);
  const { useGetAll, useRemove } = useAdherents();
  const { data, isLoading, error, refetch } = useGetAll();
  const remove = useRemove();

  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [deleteModal, setDeleteModal] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState("list");
  const itemsPerPage = 10;

  const allAdherents = data?.data || [];

  const filteredAdherents = useMemo(() => {
    return allAdherents.filter((adherent) => {
      if (filter !== "all" && adherent.statut !== filter) return false;

      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          adherent.nom?.toLowerCase().includes(search) ||
          adherent.prenom?.toLowerCase().includes(search) ||
          `${adherent.nom} ${adherent.prenom}`.toLowerCase().includes(search) ||
          adherent.email?.toLowerCase().includes(search)
        );
      }
      return true;
    });
  }, [allAdherents, filter, searchTerm]);

  if (isLoading) return <LoadingSpinner variant="list" />;
  if (error) return <ErrorState onRetry={refetch} />;

  const totalPages = Math.ceil(filteredAdherents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAdherents = filteredAdherents.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const handleDelete = async (id) => {
    try {
      await remove.mutateAsync(id);
      refetch();
      setDeleteModal(null);
    } catch (error) {
      console.error("Échec de la suppression de l'adhérent :", error);
    }
  };

  if (filteredAdherents.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-lg"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
          <FiUser className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Aucun adhérent trouvé
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {searchTerm || filter !== "all"
            ? "Aucun résultat pour vos critères"
            : "Commencez par ajouter votre premier adhérent"}
        </p>
        {(searchTerm || filter !== "all") && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              setFilter("all");
              setCurrentPage(1);
            }}
            className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <FiX className="w-4 h-4" /> Réinitialiser la recherche
          </button>
        )}
        {canManageAdherent && (
          <Link
            to="/adherents/create"
            className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            <FiPlus className="w-4 h-4" /> Ajouter un adhérent
          </Link>
        )}
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barre de recherche et filtres */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, prénom ou email..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white sm:w-auto"
          >
            <option value="all">Tous</option>
            {STATUT_ADHERENT_OPTIONS.map((statut) => (
              <option key={statut} value={statut}>
                {statut}
              </option>
            ))}
          </select>
          {canManageAdherent && (
            <Link
              to="/adherents/communication"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-indigo-600 px-4 py-2 text-indigo-600 transition-colors hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/20 sm:w-auto"
            >
              <FiSend className="w-4 h-4" />
              Communication
            </Link>
          )}
          {canManageAdherent && (
            <Link
              to="/adherents/create"
              className="col-span-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700 sm:col-auto sm:w-auto"
            >
              <FiPlus className="w-4 h-4" />
              Ajouter
            </Link>
          )}
          <div className="col-span-2 flex items-center justify-center gap-1 rounded-lg border border-gray-200 bg-gray-100 p-1 dark:border-gray-700 dark:bg-gray-800 sm:col-auto">
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

      {/* Liste des adhérents */}
      <AnimatePresence>
        {paginatedAdherents.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
          >
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              Aucun adhérent trouvé
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              {searchTerm || filter !== "all"
                ? "Essayez de modifier vos filtres"
                : "Aucun adhérent pour le moment"}
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={
              viewMode === "grid"
                ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
                : "grid gap-3"
            }
          >
            {viewMode === "grid"
              ? paginatedAdherents.map((adherent) => (
                  <motion.div
                    key={adherent.num_adherent}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 flex flex-col items-center text-center hover:shadow-lg transition-shadow"
                  >
                    {adherent.photo ? (
                      <img
                        src={photoUrl(adherent.photo)}
                        alt={`${adherent.prenom} ${adherent.nom}`}
                        className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30 flex items-center justify-center border-2 border-gray-200 dark:border-gray-600">
                        <FiUser className="w-9 h-9 text-indigo-600 dark:text-indigo-400" />
                      </div>
                    )}
                    <h3 className="font-semibold text-gray-900 dark:text-white mt-3 truncate w-full">
                      {adherent.civilite} {adherent.nom} {adherent.prenom}
                    </h3>
                    <p className="flex items-center justify-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1 truncate w-full">
                      <FiMail className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{adherent.email}</span>
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        <FiAward className="w-3 h-3" />
                        {adherent.niveau || "Non défini"}
                      </span>
                      <StatusBadge status={adherent.statut} />
                      {adherent.est_invite && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          title="Fiche invité : facturé au tarif non-adhérent, hors communications ciblées"
                        >
                          Invité
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                      {adherent.nb_plongees_total || 0} plongées
                    </p>
                    <div className="flex items-center justify-center gap-1 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 w-full">
                      <Link
                        to={`/adherents/${adherent.num_adherent}`}
                        className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Voir"
                      >
                        <FiEye className="w-4 h-4" />
                      </Link>
                      {canManageAdherent && (
                        <>
                          <Link
                            to={`/adherents/edit/${adherent.num_adherent}`}
                            className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <FiEdit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => setDeleteModal(adherent.num_adherent)}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                ))
              : paginatedAdherents.map((adherent) => (
              <motion.div
                key={adherent.num_adherent}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  {/* Photo / Avatar */}
                  <div className="flex-shrink-0">
                    {adherent.photo ? (
                      <img
                        src={photoUrl(adherent.photo)}
                        alt={`${adherent.prenom} ${adherent.nom}`}
                        className="w-14 h-14 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30 flex items-center justify-center border-2 border-gray-200 dark:border-gray-600">
                        <FiUser className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                      </div>
                    )}
                  </div>

                  {/* Informations */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {adherent.civilite} {adherent.nom} {adherent.prenom}
                        </h3>
                        <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1 truncate">
                            <FiMail className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{adherent.email}</span>
                          </span>
                          <span className="hidden sm:inline">•</span>
                          <span className="flex items-center gap-1">
                            <FiPhone className="w-3.5 h-3.5 flex-shrink-0" />
                            {adherent.telephone || "Non renseigné"}
                          </span>
                          <span className="hidden sm:inline">•</span>
                          <span className="flex items-center gap-1">
                            <FiCalendar className="w-3.5 h-3.5 flex-shrink-0" />
                            {new Date(
                              adherent.date_inscription,
                            ).toLocaleDateString("fr-FR")}
                          </span>
                          <span className="hidden sm:inline">•</span>
                          <span className="flex items-center gap-2 flex-wrap">
                            <span className="flex items-center gap-1">
                              <FiAward className="w-3.5 h-3.5 flex-shrink-0" />
                              {adherent.niveau || "Non défini"}
                            </span>
                            <StatusBadge status={adherent.statut} />
                            {adherent.est_invite && (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                title="Fiche invité : facturé au tarif non-adhérent, hors communications ciblées"
                              >
                                Invité
                              </span>
                            )}
                            <span>
                              {adherent.nb_plongees_total || 0} plongées
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Link
                          to={`/adherents/${adherent.num_adherent}`}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Voir"
                        >
                          <FiEye className="w-4 h-4" />
                        </Link>
                        {canManageAdherent && (
                          <>
                            <Link
                              to={`/adherents/edit/${adherent.num_adherent}`}
                              className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <FiEdit className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => setDeleteModal(adherent.num_adherent)}
                              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700"
        >
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Précédent
          </button>
          <span className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Suivant
          </button>
        </motion.div>
      )}

      {/* Modal de confirmation de suppression */}
      <ConfirmModal
        isOpen={!!deleteModal}
        message="Êtes-vous sûr de vouloir supprimer cet adhérent ?"
        onCancel={() => setDeleteModal(null)}
        onConfirm={() => handleDelete(deleteModal)}
      />
    </div>
  );
};

export default AdherentList;
