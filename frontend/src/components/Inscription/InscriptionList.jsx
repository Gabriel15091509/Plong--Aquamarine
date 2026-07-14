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
  FiUser,
} from "react-icons/fi";
import LoadingSpinner from "../Common/LoadingSpinner";
import { useInscriptions } from "../../hooks/useInscriptions";
import { useAdherents } from "../../hooks/useAdherents";
import { useSorties } from "../../hooks/useSorties";
import { useAuth } from "../../context/AuthContext";
import StatusBadge from "../Common/StatusBadge";
import { formatDate } from "../../utils/helpers";
import { photoUrl } from "../../utils/photoUrl";

// TODO: Ajouter un filtre par date de sortie
const InscriptionList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState("all");
  const [filterSortie, setFilterSortie] = useState("all");
  const [loading, setLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [cancelModal, setCancelModal] = useState(null);
  const [waitlistModal, setWaitlistModal] = useState(null);
  const itemsPerPage = 10;

  // Auth
  const { user } = useAuth();
  const isAdmin = ["president", "moniteur", "tresorier"].includes(
    user?.role,
  );
  const isAdherent = !isAdmin;

  // Hooks
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

  const allInscriptions = data?.data || [];

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

  const currentAdherent = useMemo(() => {
    if (!adherentsData?.data || !user) return null;
    return adherentsData.data.find((adherent) => adherent.email === user.email);
  }, [adherentsData, user]);

  // Capacités par sortie
  const capacityBySortie = useMemo(() => {
    const map = {};
    if (sortiesData?.data) {
      sortiesData.data.forEach((sortie) => {
        const sortieInscriptions = allInscriptions.filter(
          (inscription) => inscription.id_sortie === sortie.id_sortie,
        );
        const confirmees = sortieInscriptions.filter(
          (inscription) => inscription.statut === "Confirmée",
        ).length;
        const listeAttente = sortieInscriptions.filter(
          (inscription) => inscription.statut === "Liste d'attente",
        ).length;
        const enAttente = sortieInscriptions.filter(
          (inscription) => inscription.statut === "En attente",
        ).length;

        map[sortie.id_sortie] = {
          nbPlaces: sortie.nb_places || 0,
          confirmees,
          listeAttente,
          enAttente,
          placesDisponibles: Math.max((sortie.nb_places || 0) - confirmees, 0),
        };
      });
    }
    return map;
  }, [sortiesData, allInscriptions]);

  // Map des sorties
  const sortieMap = useMemo(() => {
    const map = {};
    if (sortiesData?.data) {
      sortiesData.data.forEach((sortie) => {
        map[sortie.id_sortie] = {
          label: `${sortie.type} - ${sortie.lieu} (${sortie.site})`,
          date: sortie.date_heure,
          type: sortie.type,
          id: sortie.id_sortie,
          capacity: capacityBySortie[sortie.id_sortie],
        };
      });
    }
    return map;
  }, [sortiesData, capacityBySortie]);

  // Options de filtrage
  const sortieOptions = useMemo(() => {
    const options = [{ value: "all", label: "Toutes les sorties" }];
    if (sortiesData?.data) {
      sortiesData.data.forEach((sortie) => {
        options.push({
          value: sortie.id_sortie.toString(),
          label: `${sortie.type} - ${sortie.lieu} (${new Date(sortie.date_heure).toLocaleDateString("fr-FR")})`,
        });
      });
    }
    return options;
  }, [sortiesData]);

  // Filtrage par rôle
  const filteredByRole = useMemo(() => {
    if (isAdmin) return allInscriptions;
    if (isAdherent && currentAdherent) {
      return allInscriptions.filter(
        (i) => i.num_adherent === currentAdherent.num_adherent,
      );
    }
    return [];
  }, [allInscriptions, isAdmin, isAdherent, currentAdherent]);

  // Filtrage final
  const filteredInscriptions = useMemo(() => {
    return filteredByRole.filter((i) => {
      const adherentInfo = adherentMap[i.num_adherent] || { nom: `#${i.num_adherent}` };
      const adherentName = adherentInfo.nom;
      const sortieName = sortieMap[i.id_sortie]?.label || "";
      const matchSearch =
        adherentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sortieName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = filter === "all" || i.statut === filter;
      const matchSortie =
        filterSortie === "all" || i.id_sortie.toString() === filterSortie;

      return matchSearch && matchStatus && matchSortie;
    });
  }, [
    filteredByRole,
    adherentMap,
    sortieMap,
    searchTerm,
    filter,
    filterSortie,
  ]);

  // Pagination
  const totalPages = Math.ceil(filteredInscriptions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedInscriptions = useMemo(() => {
    return filteredInscriptions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredInscriptions, startIndex, itemsPerPage]);

  if (isLoading || loadingAdherents || loadingSorties)
    return <LoadingSpinner />;
  if (error) return <div className="text-red-500">Erreur: {error.message}</div>;

  // Actions
  const handleDelete = async (id) => {
    if (!isAdmin) {
      toast.error("Vous n'avez pas les droits pour supprimer une inscription");
      return;
    }
    setLoading(true);
    try {
      await remove.mutateAsync(id);
      toast.success("Inscription supprimée avec succès");
      refetch();
      setDeleteModal(null);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Erreur lors de la suppression",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id) => {
    if (!isAdmin) {
      toast.error("Seul un gestionnaire peut confirmer");
      return;
    }
    setLoading(true);
    try {
      await confirm.mutateAsync(id);
      toast.success("Inscription confirmée avec succès");
      refetch();
      setConfirmModal(null);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Erreur lors de la confirmation",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    setLoading(true);
    try {
      await cancel.mutateAsync(id);
      toast.success("Inscription annulée avec succès");
      refetch();
      setCancelModal(null);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Erreur lors de l'annulation",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleWaitlist = async (id) => {
    if (!isAdmin) {
      toast.error("Seul un gestionnaire peut gérer la liste d'attente");
      return;
    }
    setLoading(true);
    try {
      await updateInscription.mutateAsync({
        id,
        data: { statut: "Liste d'attente" },
      });
      toast.success("Inscription ajoutée à la liste d'attente");
      refetch();
      setWaitlistModal(null);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Erreur lors de la mise en liste d'attente",
      );
    } finally {
      setLoading(false);
    }
  };

  if (filteredInscriptions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-lg"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
          <FiClipboard className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {isAdherent
            ? "Vous n'avez pas encore d'inscription"
            : "Aucune inscription trouvée"}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {searchTerm || filter !== "all" || filterSortie !== "all"
            ? "Aucun résultat pour vos critères"
            : isAdherent
              ? "Inscrivez-vous à une sortie de plongée"
              : "Commencez par créer une nouvelle inscription"}
        </p>
        <Link
          to="/inscriptions/create"
          className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          <FiPlus className="w-4 h-4" />
          {isAdherent ? "M'inscrire" : "Nouvelle inscription"}
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
            placeholder={
              isAdherent
                ? "Rechercher dans vos inscriptions..."
                : "Rechercher par adhérent ou sortie..."
            }
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Tous</option>
            <option value="En attente">En attente</option>
            <option value="Confirmée">Confirmées</option>
            <option value="Annulée">Annulées</option>
            <option value="Liste d'attente">Liste d'attente</option>
          </select>

          <select
            value={filterSortie}
            onChange={(e) => {
              setFilterSortie(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          >
            {sortieOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <Link
            to="/inscriptions/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <FiPlus className="w-4 h-4" />
            {isAdherent ? "M'inscrire" : "Nouvelle"}
          </Link>
        </div>
      </div>

      {/* Liste des inscriptions */}
      <AnimatePresence>
        {paginatedInscriptions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
          >
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              Aucune inscription trouvée
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              {searchTerm || filter !== "all" || filterSortie !== "all"
                ? "Essayez de modifier vos filtres"
                : "Aucune inscription pour le moment"}
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid gap-3"
          >
            {paginatedInscriptions.map((inscription) => {
              const adherentInfo = adherentMap[inscription.num_adherent] || {
                nom: `#${inscription.num_adherent}`,
                photo: null,
              };
              const adherentName = adherentInfo.nom;
              const sortieInfo = sortieMap[inscription.id_sortie] || {
                label: `#${inscription.id_sortie}`,
              };
              const capacityInfo = capacityBySortie[inscription.id_sortie] || {};
              const hasAvailablePlace = (capacityInfo.placesDisponibles || 0) > 0;
              const canConfirm =
                isAdmin &&
                ["En attente", "Liste d'attente"].includes(inscription.statut) &&
                hasAvailablePlace;
              const canMoveToWaitlist =
                isAdmin &&
                inscription.statut === "En attente" &&
                !hasAvailablePlace;
              const isOwnInscription =
                isAdherent &&
                currentAdherent &&
                inscription.num_adherent === currentAdherent.num_adherent;

              return (
                <motion.div
                  key={inscription.id_inscription}
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
                          #{inscription.num_adherent}
                          {isOwnInscription && (
                            <span className="ml-1 text-blue-600 dark:text-blue-400">
                              (Vous)
                            </span>
                          )}
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
                            <span className="text-sm text-gray-400 dark:text-gray-500">•</span>
                            <span className="text-sm text-indigo-600 dark:text-indigo-400">
                              {sortieInfo.label}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <FiCalendar className="w-3.5 h-3.5" />
                              {formatDate(inscription.date_inscription)}
                            </span>
                            <span>•</span>
                            {inscription.presence_checked ? (
                              inscription.presence ? (
                                <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                  <FiCheck className="w-3.5 h-3.5" /> Présent
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                                  <FiX className="w-3.5 h-3.5" /> Absent
                                </span>
                              )
                            ) : (
                              <span className="flex items-center gap-1 text-gray-400">
                                <FiClock className="w-3.5 h-3.5" /> Non pointé
                              </span>
                            )}
                            <span>•</span>
                            <StatusBadge status={inscription.statut} />
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {/* Pointage */}
                          {isAdmin && (
                            <Link
                              to={`/sorties/${inscription.id_sortie}/pointage`}
                              className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                              title="Gérer le pointage"
                            >
                              <FiClipboard className="w-4 h-4" />
                            </Link>
                          )}

                          {/* Confirmer */}
                          {canConfirm && (
                            <button
                              onClick={() => setConfirmModal(inscription.id_inscription)}
                              disabled={loading}
                              className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors disabled:opacity-50"
                              title="Confirmer"
                            >
                              <FiCheck className="w-4 h-4" />
                            </button>
                          )}

                          {/* Liste d'attente */}
                          {canMoveToWaitlist && (
                            <button
                              onClick={() => setWaitlistModal(inscription.id_inscription)}
                              disabled={loading}
                              className="p-2 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors disabled:opacity-50"
                              title="Mettre en liste d'attente"
                            >
                              <FiClock className="w-4 h-4" />
                            </button>
                          )}

                          {/* Annuler */}
                          {(inscription.statut === "En attente" ||
                            inscription.statut === "Confirmée" ||
                            inscription.statut === "Liste d'attente") &&
                            (isAdmin || isOwnInscription) && (
                              <button
                                onClick={() => setCancelModal(inscription.id_inscription)}
                                disabled={loading}
                                className="p-2 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors disabled:opacity-50"
                                title="Annuler"
                              >
                                <FiX className="w-4 h-4" />
                              </button>
                            )}

                          {/* Voir */}
                          <Link
                            to={`/inscriptions/${inscription.id_inscription}`}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Voir"
                          >
                            <FiEye className="w-4 h-4" />
                          </Link>

                          {/* Supprimer */}
                          {isAdmin && (
                            <button
                              onClick={() => setDeleteModal(inscription.id_inscription)}
                              disabled={loading}
                              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                              title="Supprimer"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
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

      {/* Modal Suppression */}
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
              Êtes-vous sûr de vouloir supprimer cette inscription ?
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

      {/* Modal Confirmation */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 mb-4">
              <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                <FiCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Confirmer l'inscription</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Êtes-vous sûr de vouloir confirmer cette inscription ?
              <br />
              <span className="text-sm text-gray-500">
                L'adhérent sera officiellement inscrit à la sortie.
              </span>
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => handleConfirm(confirmModal)}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors"
              >
                Confirmer
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal Annulation */}
      {cancelModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            <div className="flex items-center gap-3 text-orange-600 dark:text-orange-400 mb-4">
              <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-900/30">
                <FiX className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Annuler l'inscription</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Êtes-vous sûr de vouloir annuler cette inscription ?
              <br />
              <span className="text-sm text-gray-500">
                Cette action peut être annulée si nécessaire.
              </span>
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setCancelModal(null)}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => handleCancel(cancelModal)}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition-colors"
              >
                Annuler l'inscription
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal Liste d'attente */}
      {waitlistModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400 mb-4">
              <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                <FiClock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Liste d'attente</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Ajouter cette inscription à la liste d'attente ?
              <br />
              <span className="text-sm text-gray-500">
                L'adhérent sera notifié si une place se libère.
              </span>
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setWaitlistModal(null)}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => handleWaitlist(waitlistModal)}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors"
              >
                Mettre en liste d'attente
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default InscriptionList;