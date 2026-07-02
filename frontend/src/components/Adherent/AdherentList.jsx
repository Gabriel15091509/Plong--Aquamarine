import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiEye,
  FiEdit,
  FiTrash2,
  FiSearch,
  FiX,
  FiUser,
  FiMail,
  FiPhone,
  FiAward,
} from "react-icons/fi";
import { useAdherents } from "../../hooks/useAdherents";
import StatusBadge from "../Common/StatusBadge";
import Pagination from "../Common/Pagination";
import LoadingSpinner from "../Common/LoadingSpinner";
import { formatDate } from "../../utils/helpers";

const AdherentList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState("all");
  const itemsPerPage = 10;

  const { useGetAll, useRemove } = useAdherents();
  const { data, isLoading, error } = useGetAll();
  const remove = useRemove();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">Erreur: {error.message}</div>;

  const allAdherents = data?.data || [];

  const filteredAdherents = allAdherents.filter((adherent) => {
    const searchLower = searchTerm.toLowerCase();
    const matchSearch =
      adherent.nom?.toLowerCase().includes(searchLower) ||
      adherent.prenom?.toLowerCase().includes(searchLower) ||
      `${adherent.nom} ${adherent.prenom}`
        .toLowerCase()
        .includes(searchLower) ||
      adherent.email?.toLowerCase().includes(searchLower) ||
      adherent.telephone?.includes(searchTerm);

    const matchFilter = filter === "all" || adherent.statut === filter;
    return matchSearch && matchFilter;
  });

  const totalPages = Math.ceil(filteredAdherents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAdherents = filteredAdherents.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const handleDelete = async (id, nom, prenom) => {
    if (window.confirm(`Supprimer ${nom} ${prenom} ?`)) {
      await remove.mutateAsync(id);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilter("all");
    setCurrentPage(1);
  };

  if (filteredAdherents.length === 0) {
    return (
      <div className="text-center py-16">
        <FiUser className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
        <h3 className="text-base font-medium text-gray-900 dark:text-white">
          Aucun adhérent trouvé
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {searchTerm || filter !== "all"
            ? "Modifiez vos critères de recherche"
            : "Ajoutez votre premier adhérent"}
        </p>
        {(searchTerm || filter !== "all") && (
          <button
            onClick={clearFilters}
            className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700"
          >
            Réinitialiser les filtres
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* Barre de recherche et filtres */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Rechercher un adhérent..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setCurrentPage(1);
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous</option>
              <option value="Actif">Actifs</option>
              <option value="Inactif">Inactifs</option>
              <option value="Suspendu">Suspendus</option>
            </select>

            {(searchTerm || filter !== "all") && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <FiX className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Résultats */}
        <div className="flex gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
          <span>{filteredAdherents.length} adhérent(s)</span>
          {searchTerm && <span>• Recherche: "{searchTerm}"</span>}
          {filter !== "all" && <span>• Filtre: {filter}</span>}
        </div>
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
            <tr>
              {[
                "Adhérent",
                "Email",
                "Téléphone",
                "Niveau",
                "Statut",
                "Plongées",
                "",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {paginatedAdherents.map((adherent, index) => (
              <motion.tr
                key={adherent.num_adherent}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.03 }}
                className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-medium text-xs">
                      {adherent.prenom?.[0]}
                      {adherent.nom?.[0]}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {adherent.civilite} {adherent.nom} {adherent.prenom}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        #{adherent.num_adherent} • Inscrit le{" "}
                        {formatDate(adherent.date_inscription)}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                    <FiMail className="w-3.5 h-3.5 text-gray-400" />
                    {adherent.email}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                  <div className="flex items-center gap-1.5">
                    <FiPhone className="w-3.5 h-3.5 text-gray-400" />
                    {adherent.telephone || "—"}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
                    <FiAward className="w-3 h-3" />
                    {adherent.niveau || "Non défini"}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <StatusBadge status={adherent.statut} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-300">
                  {adherent.nb_plongees_total || 0}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-0.5">
                    <Link
                      to={`/adherents/${adherent.num_adherent}`}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="Voir"
                    >
                      <FiEye className="w-4 h-4" />
                    </Link>
                    <Link
                      to={`/adherents/edit/${adherent.num_adherent}`}
                      className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <FiEdit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() =>
                        handleDelete(
                          adherent.num_adherent,
                          adherent.nom,
                          adherent.prenom,
                        )
                      }
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
};

export default AdherentList;
