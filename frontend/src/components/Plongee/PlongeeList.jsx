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
  FiClock,
  FiDroplet,
  FiTrendingUp,
  FiChevronRight,
  FiUser,
  FiCalendar,
  FiMapPin,
} from "react-icons/fi";
import LoadingSpinner from "../Common/LoadingSpinner";
import ModalOverlay from "../Common/ModalOverlay";
import { usePlongees } from "../../hooks/Plongee/usePlongees";
import { useAdherents } from "../../hooks/Adherent/useAdherents";
import { useAuth } from "../../context/AuthContext";
import { formatDate } from "../../utils/helpers";
import { photoUrl } from "../../utils/photoUrl";
import { TYPE_PLONGEE_OPTIONS } from "../../utils/constants";

// Brouillon : plongée créée automatiquement au pointage de présence (voir
// PalanqueeService.creerPlongeeBrouillon), profondeur/durée pas encore
// saisies par le moniteur — distinct de "Non validée" (des mesures peuvent
// être renseignées sans que la plongée soit encore validée).
const isBrouillon = (p) => p.profondeur_max == null || p.duree == null;

const PlongeeList = () => {
  // ✅ TOUS LES HOOKS EN PREMIER - AVANT TOUT RETURN CONDITIONNEL
  const { hasRole } = useAuth();
  const canManagePlongee = hasRole(["president", "moniteur"]);
  const { useGetAll, useRemove, useValidate } = usePlongees();
  const { useGetAll: useGetAllAdherents } = useAdherents();

  const { data, isLoading, error, refetch } = useGetAll();
  const { data: adherentsData, isLoading: loadingAdherents } =
    useGetAllAdherents();

  const remove = useRemove();
  const validate = useValidate();

  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [deleteModal, setDeleteModal] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const itemsPerPage = 10;

  // ✅ Map des adhérents avec leurs infos (useMemo)
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

  const allPlongees = data?.data || [];

  // ✅ Filtrage (useMemo)
  const filteredPlongees = useMemo(() => {
    return allPlongees.filter((p) => {
      const adherentInfo = adherentMap[p.num_adherent] || {
        nom: `#${p.num_adherent}`,
        photo: null,
      };
      const adherentName = adherentInfo.nom;

      if (filter !== "all") {
        const isValide = !!p.id_moniteur_validateur;
        if (filter === "valide" && !isValide) return false;
        if (filter === "non_valide" && isValide) return false;
        if (filter === "brouillon" && !isBrouillon(p)) return false;
      }

      if (typeFilter !== "all" && p.type_plongee !== typeFilter) return false;

      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          p.type_plongee?.toLowerCase().includes(search) ||
          adherentName.toLowerCase().includes(search)
        );
      }
      return true;
    });
  }, [allPlongees, adherentMap, filter, typeFilter, searchTerm]);

  const brouillonsCount = useMemo(
    () => allPlongees.filter(isBrouillon).length,
    [allPlongees],
  );

  // ✅ Pagination
  const totalPages = Math.ceil(filteredPlongees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPlongees = filteredPlongees.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  // ✅ Fonctions
  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await remove.mutateAsync(id);
      refetch();
      setDeleteModal(null);
    } catch (error) {
      console.error("Échec de la suppression de la plongée :", error);
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (id) => {
    try {
      setLoading(true);
      await validate.mutateAsync(id);
      refetch();
    } catch (error) {
      console.error("Échec de la validation de la plongée :", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ RETOURS CONDITIONNELS APRÈS TOUS LES HOOKS
  if (isLoading || loadingAdherents) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">Erreur: {error.message}</div>;

  if (filteredPlongees.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-lg"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
          <FiDroplet className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {searchTerm || filter !== "all"
            ? "Aucune plongée trouvée"
            : "Aucune plongée enregistrée"}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {searchTerm || filter !== "all"
            ? "Aucun résultat pour vos critères"
            : "Commencez par enregistrer votre première plongée"}
        </p>
        {canManagePlongee && (
          <Link
            to="/plongees/create"
            className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            <FiPlus className="w-4 h-4" /> Nouvelle plongée
          </Link>
        )}
      </motion.div>
    );
  }

  // ✅ RENDU DU COMPOSANT
  return (
    <div className="space-y-4">
      {/* Barre de recherche et filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Rechercher par adhérent ou type de plongée..."
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
            <option value="all">Toutes</option>
            <option value="brouillon">
              À compléter{brouillonsCount > 0 ? ` (${brouillonsCount})` : ""}
            </option>
            <option value="valide">Validées</option>
            <option value="non_valide">Non validées</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Tous les types</option>
            {TYPE_PLONGEE_OPTIONS.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          {canManagePlongee && (
            <Link
              to="/plongees/create"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <FiPlus className="w-4 h-4" />
              Nouvelle
            </Link>
          )}
        </div>
      </div>

      {/* Liste des plongées */}
      <AnimatePresence>
        {paginatedPlongees.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
          >
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              Aucune plongée trouvée
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              {searchTerm || filter !== "all"
                ? "Essayez de modifier vos filtres"
                : "Aucune plongée pour le moment"}
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid gap-3"
          >
            {paginatedPlongees.map((plongee) => {
              const adherentInfo = adherentMap[plongee.num_adherent] || {
                nom: `#${plongee.num_adherent}`,
                photo: null,
              };
              const adherentName = adherentInfo.nom;

              return (
                <motion.div
                  key={plongee.id_plongee}
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
                          <FiDroplet className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />
                        </div>
                      )}
                      <div className="text-center mt-1">
                        <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
                          #{plongee.num_adherent}
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
                              {plongee.type_plongee}
                            </span>
                            {isBrouillon(plongee) && (
                              <span
                                className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400"
                                title="Créée automatiquement au pointage de présence, en attente de saisie par le moniteur"
                              >
                                <FiEdit className="w-3 h-3" /> À compléter
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <FiCalendar className="w-3.5 h-3.5" />
                              {formatDate(plongee.date)}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              Profondeur:{" "}
                              <span className="font-medium text-gray-700 dark:text-gray-300">
                                {plongee.profondeur_max != null ? `${plongee.profondeur_max}m` : "—"}
                              </span>
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              Durée:{" "}
                              <span className="font-medium text-gray-700 dark:text-gray-300">
                                {plongee.duree != null ? `${plongee.duree}min` : "—"}
                              </span>
                            </span>
                            <span>•</span>
                            {plongee.id_moniteur_validateur ? (
                              <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                                <FiCheck className="w-3.5 h-3.5" /> Validée
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 font-medium">
                                <FiClock className="w-3.5 h-3.5" /> En attente
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {/* Valider - uniquement si non validée */}
                          {canManagePlongee && !plongee.id_moniteur_validateur && (
                            <button
                              onClick={() => handleValidate(plongee.id_plongee)}
                              disabled={loading}
                              className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors disabled:opacity-50"
                              title="Valider la plongée"
                            >
                              <FiCheck className="w-4 h-4" />
                            </button>
                          )}

                          <Link
                            to={`/plongees/${plongee.id_plongee}`}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Voir"
                          >
                            <FiEye className="w-4 h-4" />
                          </Link>
                          {canManagePlongee && (
                            <>
                              <Link
                                to={`/plongees/edit/${plongee.id_plongee}`}
                                className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                                title="Modifier"
                              >
                                <FiEdit className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => setDeleteModal(plongee.id_plongee)}
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
              Êtes-vous sûr de vouloir supprimer cette plongée ?
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

export default PlongeeList;
