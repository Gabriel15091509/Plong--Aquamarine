import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  FiEye,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiCalendar,
  FiMapPin,
  FiUsers,
  FiAnchor,
  FiUserPlus,
  FiX,
  FiSearch,
} from "react-icons/fi";
import LoadingSpinner from "../Common/LoadingSpinner";
import ModalOverlay from "../Common/ModalOverlay";
import { useSorties } from "../../hooks/Sortie/useSorties";
import { useInscriptions } from "../../hooks/Inscription/useInscriptions";
import { useAdherents } from "../../hooks/Adherent/useAdherents";
import { useAuth } from "../../context/AuthContext";
import { formatDateTime } from "../../utils/helpers";

// TODO: Ajouter un filtre par niveau requis
const SortieList = ({ sorties: sortiesProp }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState("all");
  const [deleteModal, setDeleteModal] = useState(null);
  const [loading, setLoading] = useState(false);
  const itemsPerPage = 10;

  const { user, hasRole } = useAuth();
  const canManageSortie = hasRole(["president", "moniteur"]);
  const { useGetAll: useGetAllAdherents } = useAdherents();
  const { useCreate: useCreateInscription } = useInscriptions();
  const { useRemove } = useSorties();

  const { data: adherentsData, isLoading: loadingAdherents } =
    useGetAllAdherents();
  const createInscription = useCreateInscription();
  const remove = useRemove();

  const sortiesBase = Array.isArray(sortiesProp) ? sortiesProp : [];

  const currentAdherentNum = useMemo(() => {
    if (!user || !adherentsData?.data) return null;
    const adherent = adherentsData.data.find((a) => a.email === user.email);
    return adherent?.num_adherent || null;
  }, [user, adherentsData]);

  const filteredSorties = useMemo(() => {
    return sortiesBase.filter((s) => {
      if (filter !== "all" && s.statut !== filter) return false;

      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          s.lieu?.toLowerCase().includes(search) ||
          s.site?.toLowerCase().includes(search) ||
          s.type?.toLowerCase().includes(search)
        );
      }
      return true;
    });
  }, [sortiesBase, filter, searchTerm]);

  const totalPages = Math.ceil(filteredSorties.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSorties = filteredSorties.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await remove.mutateAsync(id);
      setDeleteModal(null);
    } catch (error) {
      console.error("Échec de la suppression de la sortie :", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInscription = async (sortieId) => {
    if (!currentAdherentNum) {
      toast.error(
        "Vous devez être connecté en tant qu'adhérent pour vous inscrire",
      );
      return;
    }

    setLoading(true);
    try {
      await createInscription.mutateAsync({
        num_adherent: currentAdherentNum,
        id_sortie: sortieId,
        statut: "En attente",
      });
      toast.success("Inscription en attente de confirmation");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Erreur lors de l'inscription",
      );
      console.error("Échec de l'inscription à la sortie :", error);
    } finally {
      setLoading(false);
    }
  };

  if (loadingAdherents) return <LoadingSpinner variant="list" />;

  if (filteredSorties.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-lg"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
          <FiAnchor className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Aucune sortie trouvée
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {searchTerm || filter !== "all"
            ? "Aucun résultat pour vos critères"
            : "Commencez par créer votre première sortie"}
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
        {canManageSortie && (
          <Link
            to="/sorties/create"
            className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            <FiPlus className="w-4 h-4" /> Créer une sortie
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
            placeholder="Rechercher par lieu, site, type..."
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
            <option value="Planifiée">Planifiées</option>
            <option value="En cours">En cours</option>
            <option value="Terminée">Terminées</option>
            <option value="Annulée">Annulées</option>
          </select>
          {canManageSortie && (
            <Link
              to="/sorties/create"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700 sm:w-auto"
            >
              <FiPlus className="w-4 h-4" />
              Nouvelle
            </Link>
          )}
        </div>
      </div>

      {/* Liste des sorties */}
      <AnimatePresence>
        {paginatedSorties.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
          >
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              Aucune sortie trouvée
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              {searchTerm || filter !== "all"
                ? "Essayez de modifier vos filtres"
                : "Aucune sortie pour le moment"}
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid gap-3"
          >
            {paginatedSorties.map((sortie) => {
              const sortieId = sortie.id_sortie || sortie.id;
              const isPastSortie = new Date(sortie.date_heure) < new Date();
              const isFull =
                (sortie.nb_places || 0) <= (sortie.nb_inscrits || 0);

              return (
                <motion.div
                  key={sortieId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    {/* Image / Icône de la sortie */}
                    <div className="flex-shrink-0">
                      {sortie.image ? (
                        <img
                          src={sortie.image}
                          alt={sortie.lieu}
                          className="w-16 h-16 rounded-full object-cover border-2 border-indigo-200 dark:border-indigo-700 shadow-sm"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30 flex items-center justify-center border-2 border-indigo-200 dark:border-indigo-700 shadow-sm">
                          <FiAnchor className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />
                        </div>
                      )}
                      <div className="text-center mt-1">
                        <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
                          {sortie.type || "Sortie"}
                        </span>
                      </div>
                    </div>

                    {/* Informations */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {sortie.lieu || "Lieu non défini"}
                            </h3>
                            <span className="text-sm text-gray-400 dark:text-gray-500">
                              •
                            </span>
                            <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                              {sortie.site || ""}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <FiCalendar className="w-3.5 h-3.5 flex-shrink-0" />
                              {formatDateTime(sortie.date_heure)}
                            </span>
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="flex items-center gap-1">
                                <FiUsers className="w-3.5 h-3.5 flex-shrink-0" />
                                {sortie.nb_inscrits || 0}/{sortie.nb_places || 0}
                                {isFull && (
                                  <span className="text-orange-600 dark:text-orange-400 font-medium ml-1">
                                    (Complet)
                                  </span>
                                )}
                              </span>
                              <span>Niveau {sortie.niveau_requis || "—"}</span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  sortie.statut === "Planifiée"
                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                    : sortie.statut === "En cours"
                                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                      : sortie.statut === "Terminée"
                                        ? "bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-400"
                                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                }`}
                              >
                                {sortie.statut || "Planifiée"}
                              </span>
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {/* S'inscrire */}
                          {!isPastSortie && !isFull && currentAdherentNum && (
                            <button
                              onClick={() => handleInscription(sortieId)}
                              disabled={loading}
                              className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors disabled:opacity-50"
                              title="S'inscrire"
                            >
                              <FiUserPlus className="w-4 h-4" />
                            </button>
                          )}

                          <Link
                            to={`/sorties/${sortieId}`}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Voir"
                          >
                            <FiEye className="w-4 h-4" />
                          </Link>
                          {/* Verrouillé côté serveur (SortieService.update/delete) :
                              une sortie qui a quitté le statut "Planifiée" n'est
                              plus modifiable ni supprimable — seul son statut
                              peut encore évoluer. */}
                          {canManageSortie && sortie.statut === "Planifiée" && (
                            <>
                              <Link
                                to={`/sorties/edit/${sortieId}`}
                                className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                                title="Modifier"
                              >
                                <FiEdit className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => setDeleteModal(sortieId)}
                                disabled={loading}
                                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
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
              Êtes-vous sûr de vouloir supprimer cette sortie ?
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

export default SortieList;
