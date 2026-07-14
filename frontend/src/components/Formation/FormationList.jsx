import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiEye,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiCheck,
  FiClock,
  FiAward,
  FiCalendar,
  FiUser,
  FiRefreshCw,
} from "react-icons/fi";
import LoadingSpinner from "../Common/LoadingSpinner";
import { useFormations } from "../../hooks/useFormations";
import { useAdherents } from "../../hooks/useAdherents";
import StatusBadge from "../Common/StatusBadge";
import { formatDate } from "../../utils/helpers";
import { photoUrl } from "../../utils/photoUrl";

// TODO: Ajouter un filtre par niveau de formation
const FormationList = () => {
  const { useGetAll, useRemove, useComplete, useIncrementSessions } =
    useFormations();
  const { useGetAll: useGetAllAdherents } = useAdherents();

  const { data, isLoading, error, refetch } = useGetAll();
  const { data: adherentsData, isLoading: loadingAdherents } =
    useGetAllAdherents();

  const remove = useRemove();
  const complete = useComplete();
  const incrementSessions = useIncrementSessions();

  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [deleteModal, setDeleteModal] = useState(null);
  const [completeModal, setCompleteModal] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoading, setActionLoading] = useState(null);
  const itemsPerPage = 10;

  // Map des adhérents avec leurs infos
  const adherentMap = useMemo(() => {
    const map = {};
    if (adherentsData?.data) {
      adherentsData.data.forEach((adherent) => {
        map[adherent.num_adherent] = {
          nom: `${adherent.civilite} ${adherent.nom} ${adherent.prenom}`,
          photo: adherent.photo,
          num_adherent: adherent.num_adherent,
        };
      });
    }
    return map;
  }, [adherentsData]);

  const allFormations = data?.data || [];

  const filteredFormations = useMemo(() => {
    return allFormations.filter((f) => {
      const adherentInfo = adherentMap[f.num_adherent] || {
        nom: `#${f.num_adherent}`,
        photo: null,
      };
      const adherentName = adherentInfo.nom;

      if (filter !== "all" && f.statut !== filter) return false;

      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          adherentName.toLowerCase().includes(search) ||
          f.niveau_vise?.toLowerCase().includes(search)
        );
      }
      return true;
    });
  }, [allFormations, adherentMap, filter, searchTerm]);

  if (isLoading || loadingAdherents) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">Erreur: {error.message}</div>;

  const totalPages = Math.ceil(filteredFormations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedFormations = filteredFormations.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const handleDelete = async (id) => {
    try {
      setActionLoading(`delete-${id}`);
      await remove.mutateAsync(id);
      refetch();
      setDeleteModal(null);
    } catch (error) {
      console.error("Delete error:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async (id) => {
    try {
      setActionLoading(`complete-${id}`);
      await complete.mutateAsync(id);
      refetch();
      setCompleteModal(null);
    } catch (error) {
      console.error("Complete error:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleIncrementSession = async (id) => {
    try {
      setActionLoading(`session-${id}`);
      await incrementSessions.mutateAsync(id);
      refetch();
    } catch (error) {
      console.error("Session error:", error);
    } finally {
      setActionLoading(null);
    }
  };

  if (filteredFormations.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-lg"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
          <FiAward className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Aucune formation trouvée
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {searchTerm || filter !== "all"
            ? "Aucun résultat pour vos critères"
            : "Commencez par créer une nouvelle formation"}
        </p>
        <Link
          to="/formations/create"
          className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          <FiPlus className="w-4 h-4" /> Nouvelle formation
        </Link>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barre de recherche et filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Rechercher par adhérent ou niveau..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Tous</option>
            <option value="En cours">En cours</option>
            <option value="Terminée">Terminées</option>
            <option value="Abandonnée">Abandonnées</option>
            <option value="Suspendue">Suspendues</option>
          </select>
          <Link
            to="/formations/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <FiPlus className="w-4 h-4" />
            Nouvelle
          </Link>
        </div>
      </div>

      {/* Liste des formations */}
      <AnimatePresence>
        {paginatedFormations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
          >
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              Aucune formation trouvée
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              {searchTerm || filter !== "all"
                ? "Essayez de modifier vos filtres"
                : "Aucune formation pour le moment"}
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid gap-3"
          >
            {paginatedFormations.map((formation) => {
              const adherentInfo = adherentMap[formation.num_adherent] || {
                nom: `#${formation.num_adherent}`,
                photo: null,
              };
              const adherentName = adherentInfo.nom;
              const formationId = formation.id_formation || formation.id;
              const isLoading =
                actionLoading === `delete-${formationId}` ||
                actionLoading === `complete-${formationId}` ||
                actionLoading === `session-${formationId}`;

              return (
                <motion.div
                  key={formationId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    {/* Photo en évidence */}
                    <div className="flex-shrink-0">
                      {adherentInfo.photo ? (
                        <img
                          src={photoUrl(adherentInfo.photo)}
                          alt={adherentName}
                          className="w-16 h-16 rounded-full object-cover border-2 border-indigo-200 dark:border-indigo-700 shadow-sm"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30 flex items-center justify-center border-2 border-indigo-200 dark:border-indigo-700 shadow-sm">
                          <FiUser className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />
                        </div>
                      )}
                      <div className="text-center mt-1">
                        <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
                          #{formation.num_adherent}
                        </span>
                      </div>
                    </div>

                    {/* Informations */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {adherentName}
                            </h3>
                            <span className="text-sm text-gray-400 dark:text-gray-500">
                              •
                            </span>
                            <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                              <FiAward className="w-3.5 h-3.5" />
                              {formation.niveau_vise}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <FiCalendar className="w-3.5 h-3.5" />
                              {formatDate(formation.date_debut)}
                            </span>
                            <span>→</span>
                            <span className="flex items-center gap-1">
                              <FiCalendar className="w-3.5 h-3.5" />
                              {formatDate(formation.date_fin_prevue)}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <FiClock className="w-3.5 h-3.5" />
                              {formation.nb_seances_realisees} séances
                            </span>
                            <span>•</span>
                            <StatusBadge status={formation.statut} />
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {/* Ajouter séance */}
                          {formation.statut === "En cours" && (
                            <button
                              onClick={() =>
                                handleIncrementSession(formationId)
                              }
                              disabled={isLoading}
                              className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50"
                              title="Ajouter une séance"
                            >
                              {actionLoading === `session-${formationId}` ? (
                                <FiRefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <FiClock className="w-4 h-4" />
                              )}
                            </button>
                          )}

                          {/* Terminer */}
                          {formation.statut === "En cours" && (
                            <button
                              onClick={() => setCompleteModal(formationId)}
                              disabled={isLoading}
                              className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50"
                              title="Terminer la formation"
                            >
                              {actionLoading === `complete-${formationId}` ? (
                                <FiRefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <FiCheck className="w-4 h-4" />
                              )}
                            </button>
                          )}

                          <Link
                            to={`/formations/${formationId}`}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Voir"
                          >
                            <FiEye className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/formations/edit/${formationId}`}
                            className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <FiEdit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => setDeleteModal(formationId)}
                            disabled={isLoading}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                            title="Supprimer"
                          >
                            {actionLoading === `delete-${formationId}` ? (
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
      {deleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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
              Êtes-vous sûr de vouloir supprimer cette formation ?
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
        </div>
      )}

      {/* Modal de confirmation de finalisation */}
      {completeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            <div className="flex items-center gap-3 text-green-600 dark:text-green-400 mb-4">
              <div className="p-2 rounded-xl bg-green-100 dark:bg-green-900/30">
                <FiCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Terminer la formation</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Êtes-vous sûr de vouloir marquer cette formation comme terminée ?
              <br />
              <span className="text-sm text-gray-500">
                Cette action peut être annulée si nécessaire.
              </span>
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setCompleteModal(null)}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => handleComplete(completeModal)}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors"
              >
                Terminer
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default FormationList;
