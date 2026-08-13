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
  FiDollarSign,
  FiList,
  FiGrid,
  FiMail,
  FiX,
} from "react-icons/fi";
import LoadingSpinner from "../Common/LoadingSpinner";
import ModalOverlay from "../Common/ModalOverlay";
import { useTresoriers } from "../../hooks/Tresorier/useTresoriers";
import { useUsers } from "../../hooks/User/useUsers";
import { photoUrl } from "../../utils/photoUrl";

const TresorierList = () => {
  // TOUS LES HOOKS EN PREMIER - AVANT TOUT RETURN CONDITIONNEL
  const { useGetAll, useRemove } = useTresoriers();
  const { useGetAll: useGetAllUsers } = useUsers();

  const { data, isLoading, error, refetch } = useGetAll();
  const { data: usersData, isLoading: loadingUsers } = useGetAllUsers();
  const remove = useRemove();

  const [searchTerm, setSearchTerm] = useState("");
  const [deleteModal, setDeleteModal] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState("list");
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

  const allTresoriers = data?.data || [];

  const filteredTresoriers = useMemo(() => {
    return allTresoriers.filter((t) => {
      const user = userMap[t.user_id];
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          user?.name?.toLowerCase().includes(search) ||
          user?.email?.toLowerCase().includes(search) ||
          String(t.annee_en_poste || "").includes(search)
        );
      }
      return true;
    });
  }, [allTresoriers, userMap, searchTerm]);

  const totalPages = Math.ceil(filteredTresoriers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTresoriers = filteredTresoriers.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const handleDelete = async (id) => {
    try {
      await remove.mutateAsync(id);
      refetch();
      setDeleteModal(null);
    } catch (err) {
      console.error("Échec de la suppression du trésorier :", err);
    }
  };

  // RETOUR CONDITIONNEL APRÈS TOUS LES HOOKS
  if (isLoading || loadingUsers) return <LoadingSpinner variant="list" />;
  if (error) return <div className="text-red-500">Erreur: {error.message}</div>;

  if (filteredTresoriers.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-lg"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
          <FiDollarSign className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Aucun trésorier trouvé
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {searchTerm
            ? "Aucun résultat pour vos critères"
            : "Commencez par ajouter un nouveau trésorier"}
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
          to="/tresoriers/create"
          className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          <FiPlus className="w-4 h-4" /> Nouveau trésorier
        </Link>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barre de recherche */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Rechercher par nom, email ou année..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <Link
          to="/tresoriers/create"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <FiPlus className="w-4 h-4" />
          Nouveau
        </Link>
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

      {/* Liste des trésoriers */}
      <AnimatePresence>
        {paginatedTresoriers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
          >
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              Aucun trésorier trouvé
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
            {paginatedTresoriers.map((tresorier) => {
              const user = userMap[tresorier.user_id];

              if (viewMode === "grid") {
                return (
                  <motion.div
                    key={tresorier.id_tresorier}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 flex flex-col items-center text-center hover:shadow-lg transition-shadow"
                  >
                    {user?.photo ? (
                      <img
                        src={photoUrl(user.photo)}
                        alt={user.name}
                        className="w-20 h-20 rounded-full object-cover border-2 border-emerald-200 dark:border-emerald-700 shadow-sm"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center border-2 border-emerald-200 dark:border-emerald-700 shadow-sm">
                        <FiDollarSign className="w-9 h-9 text-emerald-500 dark:text-emerald-400" />
                      </div>
                    )}
                    <h3 className="font-semibold text-gray-900 dark:text-white mt-3 truncate w-full">
                      {user?.name || `Utilisateur #${tresorier.user_id}`}
                    </h3>
                    {tresorier.annee_en_poste && (
                      <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mt-0.5">
                        Trésorier {tresorier.annee_en_poste}
                      </p>
                    )}
                    {user?.email && (
                      <p className="flex items-center justify-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1 truncate w-full">
                        <FiMail className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{user.email}</span>
                      </p>
                    )}
                    <div className="flex items-center justify-center gap-1 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 w-full">
                      <Link
                        to={`/tresoriers/${tresorier.id_tresorier}`}
                        className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Voir"
                      >
                        <FiEye className="w-4 h-4" />
                      </Link>
                      <Link
                        to={`/tresoriers/edit/${tresorier.id_tresorier}`}
                        className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <FiEdit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => setDeleteModal(tresorier.id_tresorier)}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              }

              return (
                <motion.div
                  key={tresorier.id_tresorier}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      {user?.photo ? (
                        <img
                          src={photoUrl(user.photo)}
                          alt={user.name}
                          className="w-16 h-16 rounded-full object-cover border-2 border-emerald-200 dark:border-emerald-700 shadow-sm"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center border-2 border-emerald-200 dark:border-emerald-700 shadow-sm">
                          <FiDollarSign className="w-8 h-8 text-emerald-500 dark:text-emerald-400" />
                        </div>
                      )}
                      <div className="text-center mt-1">
                        <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
                          #{tresorier.id_tresorier}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {user?.name || `Utilisateur #${tresorier.user_id}`}
                            </h3>
                            {tresorier.annee_en_poste && (
                              <>
                                <span className="text-sm text-gray-400 dark:text-gray-500">
                                  •
                                </span>
                                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                  Trésorier {tresorier.annee_en_poste}
                                </span>
                              </>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {user?.email && <span>{user.email}</span>}
                            {tresorier.annee_en_poste && (
                              <span className="flex items-center gap-1">
                                <FiCalendar className="w-3.5 h-3.5" />
                                Année {tresorier.annee_en_poste}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Link
                            to={`/tresoriers/${tresorier.id_tresorier}`}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Voir"
                          >
                            <FiEye className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/tresoriers/edit/${tresorier.id_tresorier}`}
                            className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <FiEdit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => setDeleteModal(tresorier.id_tresorier)}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <FiTrash2 className="w-4 h-4" />
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
              Êtes-vous sûr de vouloir supprimer ce trésorier ?
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
    </div>
  );
};

export default TresorierList;
