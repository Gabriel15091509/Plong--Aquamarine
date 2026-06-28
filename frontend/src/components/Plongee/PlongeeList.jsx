import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiEye, FiEdit, FiTrash2, FiPlus, FiCheck, FiX } from "react-icons/fi";
import { usePlongees } from "../../hooks/usePlongees";
import { useAdherents } from "../../hooks/useAdherents";
import StatusBadge from "../Common/StatusBadge";
import Pagination from "../Common/Pagination";
import LoadingSpinner from "../Common/LoadingSpinner";
import SearchBar from "../Common/SearchBar";
import { formatDate } from "../../utils/helpers";

const PlongeeList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState("all");
  const itemsPerPage = 10;

  const { useGetAll, useRemove, useValidate } = usePlongees();
  const { useGetAll: useGetAllAdherents } = useAdherents();

  const { data, isLoading, error } = useGetAll();
  const { data: adherentsData, isLoading: loadingAdherents } =
    useGetAllAdherents();

  const remove = useRemove();
  const validate = useValidate();

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

  let plongees = data?.data || [];

  // ✅ Filtrage avec recherche par nom d'adhérent ou type de plongée
  plongees = plongees.filter((p) => {
    const adherentName = adherentMap[p.num_adherent] || "";
    const matchSearch =
      p.type_plongee?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adherentName.toLowerCase().includes(searchTerm.toLowerCase());

    if (filter === "all") return matchSearch;
    if (filter === "valide") return matchSearch && p.valide_moniteur === true;
    if (filter === "non_valide")
      return matchSearch && p.valide_moniteur === false;
    return matchSearch;
  });

  const totalPages = Math.ceil(plongees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPlongees = plongees.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette plongée ?")) {
      await remove.mutateAsync(id);
    }
  };

  const handleValidate = async (id) => {
    await validate.mutateAsync(id);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Rechercher par adhérent ou type de plongée..."
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input-field w-auto"
          >
            <option value="all">Toutes</option>
            <option value="valide">✅ Validées</option>
            <option value="non_valide">⏳ Non validées</option>
          </select>
          <Link
            to="/plongees/create"
            className="btn-primary flex items-center gap-2"
          >
            <FiPlus className="w-4 h-4" /> Nouvelle
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
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Profondeur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durée
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Validé
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedPlongees.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <FiX className="w-12 h-12 text-gray-300" />
                      <p>Aucune plongée trouvée</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedPlongees.map((plongee, index) => {
                  const adherentName =
                    adherentMap[plongee.num_adherent] ||
                    `#${plongee.num_adherent}`;

                  return (
                    <motion.tr
                      key={plongee.id_plongee}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full">
                          {plongee.type_plongee}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {adherentName}
                        </div>
                        <div className="text-xs text-gray-500">
                          #{plongee.num_adherent}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(plongee.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {plongee.profondeur_max}m
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {plongee.duree}min
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {plongee.valide_moniteur ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                            <FiCheck className="w-3 h-3" /> Validée
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-yellow-700 bg-yellow-100 rounded-full">
                            <FiCheck className="w-3 h-3" /> En attente
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-1">
                          {!plongee.valide_moniteur && (
                            <button
                              onClick={() => handleValidate(plongee.id_plongee)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Valider"
                            >
                              <FiCheck className="w-4 h-4" />
                            </button>
                          )}
                          <Link
                            to={`/plongees/${plongee.id_plongee}`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <FiEye className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/plongees/edit/${plongee.id_plongee}`}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          >
                            <FiEdit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(plongee.id_plongee)}
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

export default PlongeeList;
