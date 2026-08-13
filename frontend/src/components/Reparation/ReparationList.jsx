import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiEye,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiTool,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiX,
} from "react-icons/fi";
import LoadingSpinner from "../Common/LoadingSpinner";
import ConfirmModal from "../Common/ConfirmModal";
import { useReparations } from "../../hooks/Reparation/useReparations";
import { useMateriels } from "../../hooks/Materiel/useMateriels";
import { formatDate, formatCurrency } from "../../utils/helpers";

const ReparationList = () => {
  const { useGetAll, useRemove } = useReparations();
  const { useGetAll: useGetAllMateriels } = useMateriels();

  const { data, isLoading, error } = useGetAll();
  const { data: materielsData, isLoading: loadingMateriels } =
    useGetAllMateriels();
  const remove = useRemove();

  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [deleteModal, setDeleteModal] = useState(null);

  const materielMap = useMemo(() => {
    const map = {};
    materielsData?.data?.forEach((m) => {
      map[m.num_inventaire] = `${m.marque} ${m.modele}`;
    });
    return map;
  }, [materielsData]);

  const allReparations = data?.data || [];

  const filteredReparations = useMemo(() => {
    return allReparations.filter((r) => {
      const isEnCours = !r.date_retour;
      if (filter === "en-cours" && !isEnCours) return false;
      if (filter === "terminees" && isEnCours) return false;

      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const materielName = (materielMap[r.num_inventaire] || "").toLowerCase();
        return (
          materielName.includes(search) ||
          r.prestataire?.toLowerCase().includes(search) ||
          r.description_panne?.toLowerCase().includes(search)
        );
      }
      return true;
    });
  }, [allReparations, materielMap, filter, searchTerm]);

  const handleDelete = async (id) => {
    try {
      await remove.mutateAsync(id);
      setDeleteModal(null);
    } catch (error) {
      // toast déjà géré par le hook useRemove
    }
  };

  if (isLoading || loadingMateriels) return <LoadingSpinner variant="list" />;
  if (error) return <div className="text-red-500">Erreur: {error.message}</div>;

  if (filteredReparations.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-lg"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
          <FiTool className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Aucune réparation trouvée
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {searchTerm || filter !== "all"
            ? "Aucun résultat pour vos critères"
            : "Commencez par déclarer une nouvelle réparation"}
        </p>
        {(searchTerm || filter !== "all") && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              setFilter("all");
            }}
            className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <FiX className="w-4 h-4" /> Réinitialiser la recherche
          </button>
        )}
        <Link
          to="/reparations/create"
          className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          <FiPlus className="w-4 h-4" /> Nouvelle réparation
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
            placeholder="Rechercher par matériel, prestataire ou panne..."
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
            <option value="all">Toutes</option>
            <option value="en-cours">En cours</option>
            <option value="terminees">Terminées</option>
          </select>
          <Link
            to="/reparations/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <FiPlus className="w-4 h-4" />
            Nouvelle
          </Link>
        </div>
      </div>

      <AnimatePresence>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-3">
          {filteredReparations.map((reparation) => {
            const isEnCours = !reparation.date_retour;
            return (
              <motion.div
                key={reparation.id_reparation}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isEnCours
                          ? "bg-orange-100 dark:bg-orange-900/30"
                          : "bg-green-100 dark:bg-green-900/30"
                      }`}
                    >
                      {isEnCours ? (
                        <FiClock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                      ) : (
                        <FiCheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {materielMap[reparation.num_inventaire] ||
                              `Matériel #${reparation.num_inventaire}`}
                          </h3>
                          <span className="text-sm text-gray-400 dark:text-gray-500">•</span>
                          <span className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">
                            {reparation.prestataire}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                          {reparation.description_panne}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <FiCalendar className="w-3.5 h-3.5" />
                            {formatDate(reparation.date_constat)}
                          </span>
                          {reparation.cout && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1 font-medium text-gray-700 dark:text-gray-300">
                                <FiDollarSign className="w-3.5 h-3.5 text-indigo-500" />
                                {formatCurrency(reparation.cout)}
                              </span>
                            </>
                          )}
                          <span>•</span>
                          <span>{isEnCours ? "En cours" : "Terminée"}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Link
                          to={`/reparations/${reparation.id_reparation}`}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Voir"
                        >
                          <FiEye className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/reparations/edit/${reparation.id_reparation}`}
                          className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <FiEdit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setDeleteModal(reparation.id_reparation)}
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
      </AnimatePresence>

      <ConfirmModal
        isOpen={!!deleteModal}
        message="Êtes-vous sûr de vouloir supprimer cette réparation ?"
        onCancel={() => setDeleteModal(null)}
        onConfirm={() => handleDelete(deleteModal)}
      />
    </div>
  );
};

export default ReparationList;
