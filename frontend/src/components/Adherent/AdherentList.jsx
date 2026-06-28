import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiEye, FiEdit, FiTrash2, FiSearch, FiX } from "react-icons/fi";
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

  // Filtrage
  const filteredAdherents = allAdherents.filter((adherent) => {
    const searchLower = searchTerm.toLowerCase();
    const matchSearch = 
      adherent.nom?.toLowerCase().includes(searchLower) ||
      adherent.prenom?.toLowerCase().includes(searchLower) ||
      `${adherent.nom} ${adherent.prenom}`.toLowerCase().includes(searchLower) ||
      adherent.email?.toLowerCase().includes(searchLower) ||
      adherent.telephone?.includes(searchTerm);
    
    const matchFilter = filter === "all" || adherent.statut === filter;
    
    return matchSearch && matchFilter;
  });

  // Pagination
  const totalPages = Math.ceil(filteredAdherents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAdherents = filteredAdherents.slice(startIndex, startIndex + itemsPerPage);

  const handleDelete = async (id, nom, prenom) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${nom} ${prenom} ?`)) {
      await remove.mutateAsync(id);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilter("all");
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Barre de recherche intégrée */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Rechercher un adhérent..."
            className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm("");
                setCurrentPage(1);
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <FiX className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <select
            value={filter}
            onChange={handleFilterChange}
            className="px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white min-w-[160px]"
          >
            <option value="all">Tous les statuts</option>
            <option value="Actif">Actifs</option>
            <option value="Inactif">Inactifs</option>
            <option value="Suspendu">Suspendus</option>
          </select>

          {(searchTerm || filter !== "all") && (
            <button
              onClick={clearFilters}
              className="px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors text-sm font-medium border border-red-200 hover:border-red-300"
            >
              Effacer
            </button>
          )}
        </div>
      </div>

      {/* Résultats */}
      <div className="text-sm text-gray-500">
        {filteredAdherents.length} adhérent{filteredAdherents.length > 1 ? "s" : ""} trouvé{filteredAdherents.length > 1 ? "s" : ""}
        {searchTerm && ` pour "${searchTerm}"`}
        {filter !== "all" && ` • Statut: ${filter}`}
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Adhérent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Téléphone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Niveau
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plongées
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedAdherents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <FiSearch className="w-12 h-12 text-gray-300 mb-3" />
                      <p className="text-lg font-medium text-gray-600">Aucun adhérent trouvé</p>
                      <p className="text-sm text-gray-400 mt-1">
                        {searchTerm || filter !== "all" 
                          ? "Essayez de modifier vos critères de recherche"
                          : "Aucun adhérent n'est encore enregistré"}
                      </p>
                      {(searchTerm || filter !== "all") && (
                        <button
                          onClick={clearFilters}
                          className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >
                          Réinitialiser les filtres
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedAdherents.map((adherent, index) => (
                  <motion.tr
                    key={adherent.num_adherent}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {adherent.civilite} {adherent.nom} {adherent.prenom}
                        </div>
                        <div className="text-xs text-gray-500">
                          Inscrit le {formatDate(adherent.date_inscription)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {adherent.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {adherent.telephone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {adherent.niveau || "Non défini"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={adherent.statut} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {adherent.nb_plongees_total || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <Link
                          to={`/adherents/${adherent.num_adherent}`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <FiEye className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/adherents/edit/${adherent.num_adherent}`}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        >
                          <FiEdit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(adherent.num_adherent, adherent.nom, adherent.prenom)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
};

export default AdherentList;