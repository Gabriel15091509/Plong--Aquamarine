import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiEye,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiCheck,
  FiX,
  FiDollarSign,
  FiUser,
  FiCalendar,
  FiCreditCard,
  FiChevronRight,
  FiTag,
} from "react-icons/fi";
import LoadingSpinner from "../Common/LoadingSpinner";
import ConfirmModal from "../Common/ConfirmModal";
import { usePaiements } from "../../hooks/Paiement/usePaiements";
import { useAdherents } from "../../hooks/Adherent/useAdherents";
import { useAuth } from "../../context/AuthContext";
import StatusBadge from "../Common/StatusBadge";
import { formatDate, formatCurrency } from "../../utils/helpers";
import { photoUrl } from "../../utils/photoUrl";

const PaiementList = () => {
  // ✅ 1. TOUS LES HOOKS au même niveau, avant toute condition
  const { hasRole } = useAuth();
  const canManagePaiement = hasRole(["president", "tresorier"]);
  const { useGetAll, useRemove, useProcess, useCancel } = usePaiements();
  const { useGetAll: useGetAllAdherents } = useAdherents();

  const { data, isLoading, error, refetch } = useGetAll();
  const { data: adherentsData, isLoading: loadingAdherents } =
    useGetAllAdherents();

  const remove = useRemove();
  const process = useProcess();
  const cancel = useCancel();

  // ✅ Tous les useState
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [deleteModal, setDeleteModal] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const itemsPerPage = 10;

  // ✅ Tous les useMemo
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

  const allPaiements = data?.data || [];

  const filteredPaiements = useMemo(() => {
    return allPaiements.filter((p) => {
      const adherentInfo = adherentMap[p.num_adherent] || {
        nom: `#${p.num_adherent}`,
        photo: null,
      };
      const adherentName = adherentInfo.nom;

      if (filter !== "all" && p.statut !== filter) return false;

      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          p.type_paiement?.toLowerCase().includes(search) ||
          p.reference_id?.toLowerCase().includes(search) ||
          adherentName.toLowerCase().includes(search)
        );
      }
      return true;
    });
  }, [allPaiements, adherentMap, filter, searchTerm]);

  // ✅ Calculs de pagination
  const totalPages = Math.ceil(filteredPaiements.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPaiements = filteredPaiements.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  // ✅ Handlers (pas des hooks, donc peuvent être après les conditions)
  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await remove.mutateAsync(id);
      refetch();
      setDeleteModal(null);
    } catch (error) {
      console.error("Échec de la suppression du paiement :", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (id) => {
    try {
      setLoading(true);
      await process.mutateAsync(id);
      refetch();
    } catch (error) {
      console.error("Échec du traitement du paiement :", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir annuler ce paiement ?"))
      return;
    try {
      setLoading(true);
      await cancel.mutateAsync(id);
      refetch();
    } catch (error) {
      console.error("Échec de l'annulation du paiement :", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ 2. RETOURS CONDITIONNELS APRÈS TOUS LES HOOKS
  if (isLoading || loadingAdherents) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">Erreur: {error.message}</div>;

  // ✅ 3. RENDU PRINCIPAL
  if (filteredPaiements.length === 0) {
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
          {searchTerm || filter !== "all"
            ? "Aucun paiement trouvé"
            : "Aucun paiement enregistré"}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {searchTerm || filter !== "all"
            ? "Aucun résultat pour vos critères"
            : "Commencez par créer un nouveau paiement"}
        </p>
        {canManagePaiement && (
          <Link
            to="/paiements/create"
            className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            <FiPlus className="w-4 h-4" /> Nouveau paiement
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
            placeholder="Rechercher par adhérent, type ou référence..."
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
            <option value="En attente">En attente</option>
            <option value="Payé">Payés</option>
            <option value="Partiel">Partiels</option>
            <option value="Annulé">Annulés</option>
          </select>
          {canManagePaiement && (
            <Link
              to="/paiements/create"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <FiPlus className="w-4 h-4" />
              Nouveau
            </Link>
          )}
        </div>
      </div>

      {/* Liste des paiements */}
      <AnimatePresence>
        {paginatedPaiements.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
          >
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              Aucun paiement trouvé
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              {searchTerm || filter !== "all"
                ? "Essayez de modifier vos filtres"
                : "Aucun paiement pour le moment"}
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid gap-3"
          >
            {paginatedPaiements.map((paiement) => {
              const adherentInfo = adherentMap[paiement.num_adherent] || {
                nom: `#${paiement.num_adherent}`,
                photo: null,
              };
              const adherentName = adherentInfo.nom;

              return (
                <motion.div
                  key={paiement.id_paiement}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    {/* Photo / Avatar de l'adhérent */}
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
                          #{paiement.num_adherent}
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
                            <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                              {paiement.type_paiement}
                            </span>
                            {paiement.reference_id && (
                              <>
                                <span className="text-sm text-gray-400 dark:text-gray-500">
                                  •
                                </span>
                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                  Réf: {paiement.reference_id}
                                </span>
                              </>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <FiCalendar className="w-3.5 h-3.5" />
                              {formatDate(paiement.date_paiement)}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 font-bold text-gray-700 dark:text-gray-300">
                              <FiDollarSign className="w-3.5 h-3.5 text-indigo-500" />
                              {formatCurrency(paiement.montant)}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <FiCreditCard className="w-3.5 h-3.5" />
                              {paiement.mode}
                            </span>
                            <span>•</span>
                            <StatusBadge status={paiement.statut} />
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {/* Valider - uniquement si En attente */}
                          {canManagePaiement && paiement.statut === "En attente" && (
                            <>
                              <button
                                onClick={() =>
                                  handleProcess(paiement.id_paiement)
                                }
                                disabled={loading}
                                className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors disabled:opacity-50"
                                title="Valider le paiement"
                              >
                                <FiCheck className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  handleCancel(paiement.id_paiement)
                                }
                                disabled={loading}
                                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                                title="Annuler le paiement"
                              >
                                <FiX className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          <Link
                            to={`/paiements/${paiement.id_paiement}`}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Voir"
                          >
                            <FiEye className="w-4 h-4" />
                          </Link>
                          {canManagePaiement && (
                            <>
                              <Link
                                to={`/paiements/edit/${paiement.id_paiement}`}
                                className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                                title="Modifier"
                              >
                                <FiEdit className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => setDeleteModal(paiement.id_paiement)}
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
      <ConfirmModal
        isOpen={!!deleteModal}
        message="Êtes-vous sûr de vouloir supprimer ce paiement ?"
        onCancel={() => setDeleteModal(null)}
        onConfirm={() => handleDelete(deleteModal)}
      />
    </div>
  );
};

export default PaiementList;
