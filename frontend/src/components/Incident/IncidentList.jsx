import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiEye,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiAlertTriangle,
  FiCalendar,
  FiCheckCircle,
  FiClock,
} from "react-icons/fi";
import LoadingSpinner from "../Common/LoadingSpinner";
import { useIncidents } from "../../hooks/Incident/useIncidents";
import { useSorties } from "../../hooks/Sortie/useSorties";
import { formatDateTime } from "../../utils/helpers";

const IncidentList = () => {
  const { useGetAll, useRemove } = useIncidents();
  const { useGetAll: useGetAllSorties } = useSorties();

  const { data, isLoading, error } = useGetAll();
  const { data: sortiesData, isLoading: loadingSorties } = useGetAllSorties();
  const remove = useRemove();

  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [deleteModal, setDeleteModal] = useState(null);

  const sortieMap = useMemo(() => {
    const map = {};
    if (sortiesData?.data) {
      sortiesData.data.forEach((s) => {
        map[s.id_sortie] = `${s.type} - ${s.lieu}`;
      });
    }
    return map;
  }, [sortiesData]);

  const allIncidents = data?.data || [];

  const filteredIncidents = useMemo(() => {
    return allIncidents.filter((i) => {
      if (filter === "clotures" && !i.cloture) return false;
      if (filter === "non-clotures" && i.cloture) return false;

      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const sortieName = (sortieMap[i.id_sortie] || "").toLowerCase();
        return (
          i.type?.toLowerCase().includes(search) ||
          i.description?.toLowerCase().includes(search) ||
          sortieName.includes(search)
        );
      }
      return true;
    });
  }, [allIncidents, sortieMap, filter, searchTerm]);

  const handleDelete = async (id) => {
    try {
      await remove.mutateAsync(id);
      setDeleteModal(null);
    } catch (error) {
      // toast déjà géré par le hook useRemove
    }
  };

  if (isLoading || loadingSorties) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">Erreur: {error.message}</div>;

  if (filteredIncidents.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-lg"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
          <FiAlertTriangle className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Aucun incident trouvé
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {searchTerm || filter !== "all"
            ? "Aucun résultat pour vos critères"
            : "Aucun incident déclaré pour le moment"}
        </p>
        <Link
          to="/incidents/create"
          className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          <FiPlus className="w-4 h-4" /> Déclarer un incident
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
            placeholder="Rechercher par type, description ou sortie..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Tous</option>
            <option value="non-clotures">Non clôturés</option>
            <option value="clotures">Clôturés</option>
          </select>
          <Link
            to="/incidents/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <FiPlus className="w-4 h-4" />
            Déclarer
          </Link>
        </div>
      </div>

      <AnimatePresence>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-3">
          {filteredIncidents.map((incident) => (
            <motion.div
              key={incident.id_incident}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      incident.cloture
                        ? "bg-green-100 dark:bg-green-900/30"
                        : "bg-red-100 dark:bg-red-900/30"
                    }`}
                  >
                    {incident.cloture ? (
                      <FiCheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                    ) : (
                      <FiAlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {incident.type}
                        </h3>
                        <span className="text-sm text-gray-400 dark:text-gray-500">•</span>
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {sortieMap[incident.id_sortie] || `Sortie #${incident.id_sortie}`}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                        {incident.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <FiCalendar className="w-3.5 h-3.5" />
                          {formatDateTime(incident.date_heure)}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          {incident.cloture ? (
                            <>
                              <FiCheckCircle className="w-3.5 h-3.5 text-green-500" />
                              Clôturé
                            </>
                          ) : (
                            <>
                              <FiClock className="w-3.5 h-3.5 text-red-500" />
                              Non clôturé
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Link
                        to={`/incidents/${incident.id_incident}`}
                        className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Voir"
                      >
                        <FiEye className="w-4 h-4" />
                      </Link>
                      <Link
                        to={`/incidents/edit/${incident.id_incident}`}
                        className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <FiEdit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => setDeleteModal(incident.id_incident)}
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
          ))}
        </motion.div>
      </AnimatePresence>

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
              Êtes-vous sûr de vouloir supprimer cet incident ?
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
    </div>
  );
};

export default IncidentList;
