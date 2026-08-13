import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiEye,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiPackage,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiAlertTriangle,
  FiX,
  FiSearch,
} from "react-icons/fi";
import LoadingSpinner from "../Common/LoadingSpinner";
import ModalOverlay from "../Common/ModalOverlay";
import { useAttributions } from "../../hooks/Attribution/useAttributions";
import { useMateriels } from "../../hooks/Materiel/useMateriels";
import { useAdherents } from "../../hooks/Adherent/useAdherents";
import { formatDate } from "../../utils/helpers";

const AttributionList = () => {
  const { useGetAll, useRemove } = useAttributions();
  const { useGetAll: useGetAllMateriels } = useMateriels();
  const { useGetAll: useGetAllAdherents } = useAdherents();

  const { data, isLoading, error } = useGetAll();
  const { data: materielsData, isLoading: loadingMateriels } =
    useGetAllMateriels();
  const { data: adherentsData, isLoading: loadingAdherents } =
    useGetAllAdherents();
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

  const adherentMap = useMemo(() => {
    const map = {};
    adherentsData?.data?.forEach((a) => {
      map[a.num_adherent] = `${a.nom} ${a.prenom}`;
    });
    return map;
  }, [adherentsData]);

  const allAttributions = data?.data || [];

  const filteredAttributions = useMemo(() => {
    return allAttributions.filter((a) => {
      const isEnCours = !a.date_retour_reel;
      const isEnRetard = isEnCours && new Date(a.date_retour_prevue) < new Date();
      if (filter === "en-cours" && !isEnCours) return false;
      if (filter === "retournes" && isEnCours) return false;
      if (filter === "retard" && !isEnRetard) return false;
      if (filter === "prets" && a.id_sortie) return false;

      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const materielName = (materielMap[a.num_inventaire] || "").toLowerCase();
        const adherentName = (adherentMap[a.num_adherent] || "").toLowerCase();
        return (
          materielName.includes(search) || adherentName.includes(search)
        );
      }
      return true;
    });
  }, [allAttributions, materielMap, adherentMap, filter, searchTerm]);

  const handleDelete = async (id) => {
    try {
      await remove.mutateAsync(id);
      setDeleteModal(null);
    } catch (error) {
      // toast déjà géré par le hook useRemove
    }
  };

  if (isLoading || loadingMateriels || loadingAdherents)
    return <LoadingSpinner variant="list" />;
  if (error) return <div className="text-red-500">Erreur: {error.message}</div>;

  if (filteredAttributions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-lg"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
          <FiPackage className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Aucune attribution trouvée
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {searchTerm || filter !== "all"
            ? "Aucun résultat pour vos critères"
            : "Commencez par créer une nouvelle attribution"}
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
          to="/attributions/create"
          className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          <FiPlus className="w-4 h-4" /> Nouvelle attribution
        </Link>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par matériel ou adhérent..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white sm:w-auto"
          >
            <option value="all">Toutes</option>
            <option value="en-cours">En cours</option>
            <option value="retournes">Retournées</option>
            <option value="retard">En retard</option>
            <option value="prets">Prêts (sans sortie)</option>
          </select>
          <Link
            to="/attributions/create"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700 sm:w-auto"
          >
            <FiPlus className="w-4 h-4" />
            Nouvelle
          </Link>
        </div>
      </div>

      <AnimatePresence>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-3">
          {filteredAttributions.map((attribution) => {
            const isEnCours = !attribution.date_retour_reel;
            const isEnRetard = isEnCours && new Date(attribution.date_retour_prevue) < new Date();
            return (
              <motion.div
                key={attribution.id_attribution}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isEnRetard
                          ? "bg-red-100 dark:bg-red-900/30"
                          : isEnCours
                            ? "bg-blue-100 dark:bg-blue-900/30"
                            : "bg-green-100 dark:bg-green-900/30"
                      }`}
                    >
                      {isEnRetard ? (
                        <FiAlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                      ) : isEnCours ? (
                        <FiClock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
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
                            {materielMap[attribution.num_inventaire] ||
                              `Matériel #${attribution.num_inventaire}`}
                          </h3>
                          <span className="text-sm text-gray-400 dark:text-gray-500">•</span>
                          <span className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">
                            {adherentMap[attribution.num_adherent] ||
                              `Adhérent #${attribution.num_adherent}`}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <FiCalendar className="w-3.5 h-3.5 flex-shrink-0" />
                            {formatDate(attribution.date_attribution)}
                            <span>→</span>
                            {formatDate(attribution.date_retour_prevue)}
                          </span>
                          <span className="flex flex-wrap items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                isEnRetard
                                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                  : isEnCours
                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                    : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              }`}
                            >
                              {isEnRetard ? "En retard" : isEnCours ? "En cours" : "Retourné"}
                            </span>
                            {!attribution.id_sortie && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                                Prêt (sans sortie)
                              </span>
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Link
                          to={`/attributions/${attribution.id_attribution}`}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Voir"
                        >
                          <FiEye className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/attributions/edit/${attribution.id_attribution}`}
                          className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <FiEdit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setDeleteModal(attribution.id_attribution)}
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
              Êtes-vous sûr de vouloir supprimer cette attribution ?
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

export default AttributionList;
