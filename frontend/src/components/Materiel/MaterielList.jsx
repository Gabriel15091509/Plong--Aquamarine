import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiEye,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiTool,
  FiBox,
  FiSearch,
  FiX,
  FiChevronRight,
  FiUser,
  FiMapPin,
  FiTag,
  FiList,
  FiGrid,
  FiCalendar,
} from "react-icons/fi";
import LoadingSpinner from "../Common/LoadingSpinner";
import ModalOverlay from "../Common/ModalOverlay";
import { useMateriels } from "../../hooks/Materiel/useMateriels";
import { formatDate } from "../../utils/helpers";
import { photoUrl } from "../../utils/photoUrl";
import { CATEGORIE_MATERIEL_OPTIONS } from "../../utils/constants";

import ErrorState from "../Common/ErrorState";

const MaterielList = () => {
  const { useGetAll, useRemove } = useMateriels();
  const { data, isLoading, error, refetch } = useGetAll();
  const remove = useRemove();

  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [categorieFilter, setCategorieFilter] = useState("all");
  const [deleteModal, setDeleteModal] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState("list");
  const itemsPerPage = 10;

  const allMateriels = data?.data || [];

  const filteredMateriels = useMemo(() => {
    return allMateriels.filter((m) => {
      if (filter !== "all" && m.etat !== filter) return false;
      if (categorieFilter !== "all" && m.categorie !== categorieFilter) return false;

      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          m.num_inventaire?.toLowerCase().includes(search) ||
          m.marque?.toLowerCase().includes(search) ||
          m.modele?.toLowerCase().includes(search) ||
          m.categorie?.toLowerCase().includes(search) ||
          m.localisation?.toLowerCase().includes(search)
        );
      }
      return true;
    });
  }, [allMateriels, filter, categorieFilter, searchTerm]);

  if (isLoading) return <LoadingSpinner variant="list" />;
  if (error) return <ErrorState onRetry={refetch} />;

  const totalPages = Math.ceil(filteredMateriels.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMateriels = filteredMateriels.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await remove.mutateAsync(id);
      refetch();
      setDeleteModal(null);
    } catch (error) {
      console.error("Échec de la suppression du matériel :", error);
    } finally {
      setLoading(false);
    }
  };

  const getEtatColor = (etat) => {
    const colors = {
      Neuf: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
      Bon: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      Usagé: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      "À réparer": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
      "Hors service": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    };
    return colors[etat] || "bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-400";
  };

  const getLocalisationColor = (localisation) => {
    const colors = {
      Local: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
      "Prêté": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      "En réparation": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    };
    return colors[localisation] || "bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-400";
  };

  if (filteredMateriels.length === 0) {
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
          {searchTerm || filter !== "all"
            ? "Aucun matériel trouvé"
            : "Aucun matériel enregistré"}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {searchTerm || filter !== "all"
            ? "Aucun résultat pour vos critères"
            : "Commencez par ajouter votre premier équipement"}
        </p>
        {(searchTerm || filter !== "all" || categorieFilter !== "all") && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              setFilter("all");
              setCategorieFilter("all");
              setCurrentPage(1);
            }}
            className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <FiX className="w-4 h-4" /> Réinitialiser la recherche
          </button>
        )}
        <Link
          to="/materiels/create"
          className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          <FiPlus className="w-4 h-4" /> Nouveau matériel
        </Link>
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
            placeholder="Rechercher par numéro, marque, modèle, catégorie..."
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
            <option value="Neuf">Neuf</option>
            <option value="Bon">Bon</option>
            <option value="Usagé">Usagé</option>
            <option value="À réparer">À réparer</option>
            <option value="Hors service">Hors service</option>
          </select>
          <select
            value={categorieFilter}
            onChange={(e) => {
              setCategorieFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white sm:w-auto"
          >
            <option value="all">Toutes catégories</option>
            {CATEGORIE_MATERIEL_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <Link
            to="/materiels/create"
            className="col-span-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700 sm:col-auto sm:w-auto"
          >
            <FiPlus className="w-4 h-4" />
            Nouveau
          </Link>
          <div className="col-span-2 flex items-center justify-center gap-1 rounded-lg border border-gray-200 bg-gray-100 p-1 dark:border-gray-700 dark:bg-gray-800 sm:col-auto">
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

      {/* Liste des matériels */}
      <AnimatePresence>
        {paginatedMateriels.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl"
          >
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              Aucun matériel trouvé
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              {searchTerm || filter !== "all"
                ? "Essayez de modifier vos filtres"
                : "Aucun matériel pour le moment"}
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
            {viewMode === "grid"
              ? paginatedMateriels.map((materiel) => (
                  <motion.div
                    key={materiel.num_inventaire}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
                  >
                    {/* Photo du matériel */}
                    <div className="relative h-40 bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30 flex items-center justify-center">
                      {materiel.photo_path ? (
                        <img
                          src={photoUrl(materiel.photo_path)}
                          alt={`${materiel.marque} ${materiel.modele}`}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <FiBox className="w-12 h-12 text-indigo-400 dark:text-indigo-500" />
                      )}
                      <div className="absolute inset-x-0 top-0 p-3 flex items-center justify-between gap-1.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm ${getEtatColor(materiel.etat)}`}
                        >
                          {materiel.etat}
                        </span>
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm ${getLocalisationColor(materiel.localisation)}`}
                        >
                          {materiel.localisation || "Non localisé"}
                        </span>
                      </div>
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                        <span className="text-lg font-bold text-white drop-shadow">
                          #{materiel.num_inventaire}
                        </span>
                      </div>
                    </div>

                    {/* Contenu */}
                    <div className="p-4 flex flex-col flex-1">
                      <span className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                        {materiel.categorie}
                      </span>
                      <h3 className="font-semibold text-gray-900 dark:text-white mt-1 truncate">
                        {materiel.marque}
                      </h3>
                      <p className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        <FiTag className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{materiel.modele}</span>
                      </p>

                      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 text-center">
                        <div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {materiel.taille || "—"}
                          </div>
                          <div className="text-[11px] text-gray-400">
                            Taille
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {materiel.capacite || materiel.epaisseur || "—"}
                          </div>
                          <div className="text-[11px] text-gray-400">
                            Capacité
                          </div>
                        </div>
                        <div>
                          <FiCalendar className="w-4 h-4 mx-auto text-gray-400" />
                          <div className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">
                            {materiel.date_achat
                              ? formatDate(materiel.date_achat)
                              : "—"}
                          </div>
                          <div className="text-[11px] text-gray-400">
                            Achat
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <Link
                          to={`/materiels/${materiel.num_inventaire}`}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Voir"
                        >
                          <FiEye className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/materiels/edit/${materiel.num_inventaire}`}
                          className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <FiEdit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() =>
                            setDeleteModal(materiel.num_inventaire)
                          }
                          disabled={loading}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                          title="Supprimer"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              : paginatedMateriels.map((materiel) => (
              <motion.div
                key={materiel.num_inventaire}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  {/* Photo ou icône du matériel */}
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30 flex items-center justify-center border-2 border-indigo-200 dark:border-indigo-700 shadow-sm overflow-hidden">
                      {materiel.photo_path ? (
                        <img
                          src={photoUrl(materiel.photo_path)}
                          alt={`${materiel.marque} ${materiel.modele}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FiBox className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />
                      )}
                    </div>
                    <div className="text-center mt-1">
                      <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
                        #{materiel.num_inventaire}
                      </span>
                    </div>
                  </div>

                  {/* Informations */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {materiel.marque}
                          </h3>
                          <span className="text-sm text-gray-400 dark:text-gray-500">•</span>
                          <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                            {materiel.modele}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <FiTag className="w-3.5 h-3.5 flex-shrink-0" />
                            {materiel.categorie}
                          </span>
                          {materiel.date_achat && (
                            <span>Acheté le {formatDate(materiel.date_achat)}</span>
                          )}
                          <span className="flex flex-wrap items-center gap-2">
                            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getLocalisationColor(materiel.localisation)}`}>
                              <FiMapPin className="w-3.5 h-3.5" />
                              {materiel.localisation || "Non localisé"}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getEtatColor(materiel.etat)}`}>
                              {materiel.etat}
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Link
                          to={`/materiels/${materiel.num_inventaire}`}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Voir"
                        >
                          <FiEye className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/materiels/edit/${materiel.num_inventaire}`}
                          className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <FiEdit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setDeleteModal(materiel.num_inventaire)}
                          disabled={loading}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
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
              Êtes-vous sûr de vouloir supprimer ce matériel ?
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

export default MaterielList;