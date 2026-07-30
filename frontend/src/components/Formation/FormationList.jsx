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
  FiPauseCircle,
  FiFileText,
  FiHash,
  FiList,
  FiGrid,
} from "react-icons/fi";
import LoadingSpinner from "../Common/LoadingSpinner";
import ModalOverlay from "../Common/ModalOverlay";
import { useFormations } from "../../hooks/Formation/useFormations";
import { useAdherents } from "../../hooks/Adherent/useAdherents";
import { useAuth } from "../../context/AuthContext";
import StatusBadge from "../Common/StatusBadge";
import { formatDate } from "../../utils/helpers";
import { photoUrl } from "../../utils/photoUrl";

// TODO: Ajouter un filtre par niveau de formation
const FormationList = () => {
  const { user, hasRole } = useAuth();
  const canManage = hasRole(["president", "moniteur"]);

  const { useGetAll, useGetByAdherent, useRemove, useComplete, useAjourner } = useFormations();
  const { useGetAll: useGetAllAdherents } = useAdherents();

  const { data: adherentsData, isLoading: loadingAdherents } =
    useGetAllAdherents();

  // Un adhérent ne doit voir que ses propres formations ("où il en est"),
  // pas la liste de gestion complète réservée à président/moniteur — on
  // n'active donc qu'une des deux requêtes selon le rôle (les deux hooks
  // restent appelés à chaque rendu pour respecter les règles des hooks,
  // seul `enabled` change lequel part réellement en réseau).
  const currentAdherent = useMemo(() => {
    if (!adherentsData?.data || !user) return null;
    return adherentsData.data.find((a) => a.email === user.email);
  }, [adherentsData, user]);

  const allQuery = useGetAll({}, { enabled: canManage });
  const mineQuery = useGetByAdherent(canManage ? null : currentAdherent?.num_adherent);
  const { data, isLoading, error, refetch } = canManage ? allQuery : mineQuery;

  const remove = useRemove();
  const complete = useComplete();
  const ajourner = useAjourner();

  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [deleteModal, setDeleteModal] = useState(null);
  const [completeModal, setCompleteModal] = useState(null);
  const [completeBrevet, setCompleteBrevet] = useState("");
  const [completeFfesm, setCompleteFfesm] = useState("");
  const [ajournerModal, setAjournerModal] = useState(null);
  const [motifAjournement, setMotifAjournement] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoading, setActionLoading] = useState(null);
  const [viewMode, setViewMode] = useState("list");
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
          num_brevet: adherent.num_brevet,
          num_licence_ffesm: adherent.num_licence_ffesm,
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
      await complete.mutateAsync({
        id,
        data: {
          num_brevet: completeBrevet.trim() || undefined,
          num_licence_ffesm: completeFfesm.trim() || undefined,
        },
      });
      refetch();
      setCompleteModal(null);
      setCompleteBrevet("");
      setCompleteFfesm("");
    } catch (error) {
      console.error("Complete error:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAjourner = async (id) => {
    if (!motifAjournement.trim()) return;
    try {
      setActionLoading(`ajourner-${id}`);
      await ajourner.mutateAsync({ id, motif: motifAjournement.trim() });
      refetch();
      setAjournerModal(null);
      setMotifAjournement("");
    } catch (error) {
      console.error("Ajourner error:", error);
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
            : canManage
              ? "Commencez par créer une nouvelle formation"
              : "Vous n'êtes inscrit à aucune formation pour le moment"}
        </p>
        {canManage && (
          <Link
            to="/formations/create"
            className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            <FiPlus className="w-4 h-4" /> Nouvelle formation
          </Link>
        )}
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
            <option value="Ajournée">Ajournées</option>
          </select>
          {canManage && (
            <Link
              to="/formations/create"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <FiPlus className="w-4 h-4" />
              Nouvelle
            </Link>
          )}
          <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
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
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                : "grid gap-3"
            }
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
                actionLoading === `ajourner-${formationId}`;
              const seancesManquantes =
                formation.nb_seances_prevues &&
                formation.nb_seances_realisees < formation.nb_seances_prevues;
              const isTerminee = formation.statut === "Terminée";

              if (viewMode === "grid") {
                return (
                  <motion.div
                    key={formationId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
                  >
                    {/* Photo de l'adhérent */}
                    <div className="relative h-40 bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30 flex items-center justify-center">
                      {adherentInfo.photo ? (
                        <img
                          src={photoUrl(adherentInfo.photo)}
                          alt={adherentName}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <FiUser className="w-12 h-12 text-indigo-400 dark:text-indigo-500" />
                      )}
                      <div className="absolute inset-x-0 top-0 p-3 flex items-center justify-between gap-1.5">
                        <StatusBadge status={formation.statut} />
                        {seancesManquantes && formation.statut === "En cours" && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 shadow-sm">
                            Séances incomplètes
                          </span>
                        )}
                      </div>
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 flex items-center gap-1.5">
                        <FiAward className="w-4 h-4 text-white" />
                        <span className="text-lg font-bold text-white drop-shadow">
                          {formation.niveau_vise}
                        </span>
                      </div>
                    </div>

                    {/* Contenu */}
                    <div className="p-4 flex flex-col flex-1">
                      <span className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                        #{formation.num_adherent}
                      </span>
                      <h3 className="font-semibold text-gray-900 dark:text-white mt-1 truncate">
                        {adherentName}
                      </h3>
                      <p className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        <FiCalendar className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">
                          {formatDate(formation.date_debut)} →{" "}
                          {formatDate(formation.date_fin_prevue)}
                        </span>
                      </p>

                      <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 text-center">
                        <FiClock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formation.nb_seances_realisees}
                          {formation.nb_seances_prevues
                            ? `/${formation.nb_seances_prevues}`
                            : ""}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          séances réalisées
                        </span>
                      </div>

                      <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                        {canManage && formation.statut === "En cours" && (
                          <button
                            onClick={() => {
                              setCompleteModal(formationId);
                              setCompleteBrevet(adherentInfo.num_brevet || "");
                              setCompleteFfesm(
                                adherentInfo.num_licence_ffesm || "",
                              );
                            }}
                            disabled={isLoading || seancesManquantes}
                            className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title={
                              seancesManquantes
                                ? `Impossible : ${formation.nb_seances_realisees}/${formation.nb_seances_prevues} séances réalisées`
                                : "Terminer la formation"
                            }
                          >
                            {actionLoading === `complete-${formationId}` ? (
                              <FiRefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <FiCheck className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        {canManage && formation.statut === "En cours" && (
                          <button
                            onClick={() => setAjournerModal(formationId)}
                            disabled={isLoading}
                            className="p-2 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-lg transition-colors disabled:opacity-50"
                            title="Ajourner (recaler l'adhérent)"
                          >
                            {actionLoading === `ajourner-${formationId}` ? (
                              <FiRefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <FiPauseCircle className="w-4 h-4" />
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
                        {canManage && (
                          <>
                            {isTerminee ? (
                              <span
                                className="p-2 text-gray-300 dark:text-gray-600 cursor-not-allowed"
                                title="Formation terminée : modification impossible"
                              >
                                <FiEdit className="w-4 h-4" />
                              </span>
                            ) : (
                              <Link
                                to={`/formations/edit/${formationId}`}
                                className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                                title="Modifier"
                              >
                                <FiEdit className="w-4 h-4" />
                              </Link>
                            )}
                            <button
                              onClick={() => setDeleteModal(formationId)}
                              disabled={isLoading || isTerminee}
                              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title={
                                isTerminee
                                  ? "Formation terminée : suppression impossible"
                                  : "Supprimer"
                              }
                            >
                              {actionLoading === `delete-${formationId}` ? (
                                <FiRefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <FiTrash2 className="w-4 h-4" />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              }

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
                              {formation.nb_seances_realisees}
                              {formation.nb_seances_prevues
                                ? `/${formation.nb_seances_prevues}`
                                : ""}{" "}
                              séances
                            </span>
                            <span>•</span>
                            <StatusBadge status={formation.statut} />
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {/* Terminer */}
                          {canManage && formation.statut === "En cours" && (
                            <button
                              onClick={() => {
                                setCompleteModal(formationId);
                                setCompleteBrevet(adherentInfo.num_brevet || "");
                                setCompleteFfesm(adherentInfo.num_licence_ffesm || "");
                              }}
                              disabled={isLoading || seancesManquantes}
                              className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title={
                                seancesManquantes
                                  ? `Impossible : ${formation.nb_seances_realisees}/${formation.nb_seances_prevues} séances réalisées`
                                  : "Terminer la formation"
                              }
                            >
                              {actionLoading === `complete-${formationId}` ? (
                                <FiRefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <FiCheck className="w-4 h-4" />
                              )}
                            </button>
                          )}

                          {/* Ajourner (recaler) */}
                          {canManage && formation.statut === "En cours" && (
                            <button
                              onClick={() => setAjournerModal(formationId)}
                              disabled={isLoading}
                              className="p-2 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-lg transition-colors disabled:opacity-50"
                              title="Ajourner (recaler l'adhérent)"
                            >
                              {actionLoading === `ajourner-${formationId}` ? (
                                <FiRefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <FiPauseCircle className="w-4 h-4" />
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
                          {canManage && (
                            <>
                              {isTerminee ? (
                                <span
                                  className="p-2 text-gray-300 dark:text-gray-600 cursor-not-allowed"
                                  title="Formation terminée : modification impossible"
                                >
                                  <FiEdit className="w-4 h-4" />
                                </span>
                              ) : (
                                <Link
                                  to={`/formations/edit/${formationId}`}
                                  className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                                  title="Modifier"
                                >
                                  <FiEdit className="w-4 h-4" />
                                </Link>
                              )}
                              <button
                                onClick={() => setDeleteModal(formationId)}
                                disabled={isLoading || isTerminee}
                                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title={
                                  isTerminee
                                    ? "Formation terminée : suppression impossible"
                                    : "Supprimer"
                                }
                              >
                                {actionLoading === `delete-${formationId}` ? (
                                  <FiRefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <FiTrash2 className="w-4 h-4" />
                                )}
                              </button>
                            </>
                          )}
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
        </ModalOverlay>
      )}

      {/* Modal de confirmation de finalisation */}
      {completeModal && (
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
              <h3 className="text-lg font-bold">Terminer la formation</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Le niveau visé sera attribué à l'adhérent
              {(() => {
                const f = allFormations.find(
                  (x) => (x.id_formation || x.id) === completeModal,
                );
                return f ? ` (${f.niveau_vise})` : "";
              })()}
              . Renseignez les numéros délivrés si vous les avez déjà (facultatif,
              modifiables plus tard) :
            </p>
            <div className="space-y-3 mb-6">
              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <FiFileText className="w-3.5 h-3.5" />
                  N° de brevet délivré
                </label>
                <input
                  type="text"
                  value={completeBrevet}
                  onChange={(e) => setCompleteBrevet(e.target.value)}
                  placeholder="Ex : FFESSM N2-2026-00123"
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-200 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <FiHash className="w-3.5 h-3.5" />
                  N° de licence FFESM
                </label>
                <input
                  type="text"
                  value={completeFfesm}
                  onChange={(e) => setCompleteFfesm(e.target.value)}
                  placeholder="Ex : FF12345"
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-200 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setCompleteModal(null);
                  setCompleteBrevet("");
                  setCompleteFfesm("");
                }}
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
        </ModalOverlay>
      )}

      {/* Modal d'ajournement (recalage) */}
      {ajournerModal && (
        <ModalOverlay className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            <div className="flex items-center gap-3 text-pink-600 dark:text-pink-400 mb-4">
              <div className="p-2 rounded-xl bg-pink-100 dark:bg-pink-900/30">
                <FiPauseCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Ajourner la formation</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-3">
              L'adhérent ne passera pas le niveau visé, même si les séances et
              compétences sont validées. Indiquez le motif :
            </p>
            <textarea
              value={motifAjournement}
              onChange={(e) => setMotifAjournement(e.target.value)}
              rows="4"
              className="w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-200 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white mb-6"
              placeholder="Ex : niveau insuffisant sur la remontée assistée, à refaire..."
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setAjournerModal(null);
                  setMotifAjournement("");
                }}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => handleAjourner(ajournerModal)}
                disabled={!motifAjournement.trim()}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-pink-600 hover:bg-pink-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Ajourner
              </button>
            </div>
          </motion.div>
        </ModalOverlay>
      )}
    </div>
  );
};

export default FormationList;
