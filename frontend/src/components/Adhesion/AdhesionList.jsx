import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiEye, FiEdit, FiTrash2, FiPlus, FiX } from "react-icons/fi";
import { useAdhesions } from "../../hooks/useAdhesions";
import { useAdherents } from "../../hooks/useAdherents";
import StatusBadge from "../Common/StatusBadge";
import Pagination from "../Common/Pagination";
import LoadingSpinner from "../Common/LoadingSpinner";
import SearchBar from "../Common/SearchBar";
import { formatDate, formatCurrency } from "../../utils/helpers";

const AdhesionList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState("all");
  const itemsPerPage = 10;

  const { useGetAll, useRemove } = useAdhesions();
  const { useGetAll: useGetAllAdherents } = useAdherents();

  const { data, isLoading, error } = useGetAll();
  const { data: adherentsData, isLoading: loadingAdherents } =
    useGetAllAdherents();

  const remove = useRemove();

  // ✅ Créer une map pour un accès rapide aux noms des adhérents
  const adherentMap = useMemo(() => {
    const map = {};
    if (adherentsData?.data) {
      adherentsData.data.forEach((adherent) => {
        map[adherent.num_adherent] =
          `${adherent.civilite} ${adherent.nom} ${adherent.prenom}`;
      });
    }
    return map;
  }, [adherentsData]);

  const isLoadingData = isLoading || loadingAdherents;

  if (isLoadingData) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">Erreur: {error.message}</div>;

  let adhesions = data?.data || [];

  // ✅ Filtrage avec recherche par nom d'adhérent, type ou numéro de licence
  adhesions = adhesions.filter((a) => {
    const adherentName = adherentMap[a.num_adherent] || "";
    const matchSearch =
      a.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.num_licence_ffesm?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adherentName.toLowerCase().includes(searchTerm.toLowerCase());
    if (filter === "all") return matchSearch;
    return matchSearch && a.statut_paiement === filter;
  });

  const totalPages = Math.ceil(adhesions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAdhesions = adhesions.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette adhésion ?")) {
      await remove.mutateAsync(id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Rechercher par adhérent, type ou licence..."
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input-field w-auto"
          >
            <option value="all">Tous</option>
            <option value="Payé">Payés</option>
            <option value="En attente">En attente</option>
            <option value="Partiel">Partiels</option>
            <option value="Annulé">Annulés</option>
          </select>
          <Link
            to="/adhesions/create"
            className="btn-primary flex items-center gap-2"
          >
            <FiPlus className="w-4 h-4" />
            Nouvelle
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Adhérent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Période
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedAdhesions.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <FiX className="w-12 h-12 text-gray-300" />
                      <p>Aucune adhésion trouvée</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedAdhesions.map((adhesion, index) => {
                  const adherentName =
                    adherentMap[adhesion.num_adherent] ||
                    `#${adhesion.num_adherent}`;

                  return (
                    <motion.tr
                      key={adhesion.id_adhesion}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {adhesion.type}
                        </span>
                        {adhesion.num_licence_ffesm && (
                          <div className="text-xs text-gray-400 mt-0.5">
                            Licence: {adhesion.num_licence_ffesm}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {adherentName}
                        </div>
                        <div className="text-xs text-gray-500">
                          #{adhesion.num_adherent}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div className="flex flex-col">
                          <span>Début: {formatDate(adhesion.date_debut)}</span>
                          <span className="text-xs text-gray-400">
                            Fin: {formatDate(adhesion.date_fin)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(adhesion.montant_paye)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={adhesion.statut_paiement} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <Link
                            to={`/adhesions/${adhesion.id_adhesion}`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <FiEye className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/adhesions/edit/${adhesion.id_adhesion}`}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          >
                            <FiEdit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(adhesion.id_adhesion)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
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

export default AdhesionList;
