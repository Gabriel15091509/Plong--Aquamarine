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
} from "react-icons/fi";
import LoadingSpinner from "../Common/LoadingSpinner";
import ModalOverlay from "../Common/ModalOverlay";
import { useSpecialitesFormation } from "../../hooks/Formation/useSpecialitesFormation";
import { useAdherents } from "../../hooks/Adherent/useAdherents";
import { useMoniteurs } from "../../hooks/Moniteur/useMoniteurs";
import StatusBadge from "../Common/StatusBadge";
import { formatDate } from "../../utils/helpers";

const SpecialiteFormationList = () => {
  const { useGetAll, useRemove } = useSpecialitesFormation();
  const { useGetAll: useGetAllAdherents } = useAdherents();
  const { useGetAll: useGetAllMoniteurs } = useMoniteurs();

  const { data, isLoading, error } = useGetAll();
  const { data: adherentsData, isLoading: loadingAdherents } = useGetAllAdherents();
  const { data: moniteursData, isLoading: loadingMoniteurs } = useGetAllMoniteurs();

  const remove = useRemove();

  const [searchTerm, setSearchTerm] = useState("");
  const [deleteModal, setDeleteModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

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

  if (isLoading || loadingAdherents || loadingMoniteurs) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">Erreur: {error.message}</div>;

  const handleDelete = async (id) => {
    try {
      setActionLoading(id);
      await remove.mutateAsync(id);
      setDeleteModal(null);
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setActionLoading(null);
    }
  };

  if (filtered.length === 0) {
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
          Aucune spécialité trouvée
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {searchTerm
            ? "Aucun résultat pour votre recherche"
            : "Commencez par inscrire un adhérent à une spécialité"}
        </p>
        <Link
          to="/specialites-formation/create"
          className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          <FiPlus className="w-4 h-4" /> Nouvelle spécialité
        </Link>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Rechercher par adhérent ou spécialité..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <Link
          to="/specialites-formation/create"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <FiPlus className="w-4 h-4" />
          Nouvelle
        </Link>
      </div>

      <AnimatePresence>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-3">
          {filtered.map((specialite) => {
            const specialiteId = specialite.id_specialite_formation;
            const adherentName = adherentMap[specialite.num_adherent] || `#${specialite.num_adherent}`;
            const moniteurName = moniteurMap[specialite.id_moniteur] || `#${specialite.id_moniteur}`;

            return (
              <motion.div
                key={specialiteId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30 flex items-center justify-center border-2 border-indigo-200 dark:border-indigo-700 shadow-sm flex-shrink-0">
                    <FiUser className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {adherentName}
                          </h3>
                          <span className="text-sm text-gray-400 dark:text-gray-500">•</span>
                          <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                            <FiAward className="w-3.5 h-3.5" />
                            {specialite.type_specialite}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <FiCalendar className="w-3.5 h-3.5" />
                            {formatDate(specialite.date_debut)}
                          </span>
                          <span>•</span>
                          <span>Moniteur : {moniteurName}</span>
                          <span>•</span>
                          <StatusBadge status={specialite.statut} />
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Link
                          to={`/specialites-formation/edit/${specialiteId}`}
                          className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <FiEdit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setDeleteModal(specialiteId)}
                          disabled={actionLoading === specialiteId}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                          title="Supprimer"
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
    </div>
  );
};

export default SpecialiteFormationList;
