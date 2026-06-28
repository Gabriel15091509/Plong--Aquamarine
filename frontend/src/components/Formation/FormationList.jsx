import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiEye,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiCheck,
  FiClock,
  FiX,
} from "react-icons/fi";
import { useFormations } from "../../hooks/useFormations";
import { useAdherents } from "../../hooks/useAdherents";
import StatusBadge from "../Common/StatusBadge";
import Pagination from "../Common/Pagination";
import LoadingSpinner from "../Common/LoadingSpinner";
import SearchBar from "../Common/SearchBar";
import { formatDate } from "../../utils/helpers";

const FormationList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState("all");
  const itemsPerPage = 10;

  const { useGetAll, useRemove, useComplete, useIncrementSessions } =
    useFormations();
  const { useGetAll: useGetAllAdherents } = useAdherents();

  const { data, isLoading, error } = useGetAll();
  const { data: adherentsData, isLoading: loadingAdherents } =
    useGetAllAdherents();

  const remove = useRemove();
  const complete = useComplete();
  const incrementSessions = useIncrementSessions();

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

  let formations = data?.data || [];

  // ✅ Filtrage avec recherche par nom d'adhérent ou niveau
  formations = formations.filter((f) => {
    const adherentName = adherentMap[f.num_adherent] || "";
    const matchSearch =
      adherentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.niveau_vise?.toLowerCase().includes(searchTerm.toLowerCase());
    if (filter === "all") return matchSearch;
    return matchSearch && f.statut === filter;
  });

  const totalPages = Math.ceil(formations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedFormations = formations.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const handleDelete = async (id) => {
    if (
      window.confirm("Êtes-vous sûr de vouloir supprimer cette formation ?")
    ) {
      await remove.mutateAsync(id);
    }
  };

  const handleComplete = async (id) => {
    if (window.confirm("Marquer cette formation comme terminée ?")) {
      await complete.mutateAsync(id);
    }
  };

  const handleIncrementSession = async (id) => {
    await incrementSessions.mutateAsync(id);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Rechercher par adhérent ou niveau..."
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input-field w-auto"
          >
            <option value="all">Toutes</option>
            <option value="En cours">En cours</option>
            <option value="Terminée">Terminées</option>
            <option value="Abandonnée">Abandonnées</option>
            <option value="Suspendue">Suspendues</option>
          </select>
          <Link
            to="/formations/create"
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
                  Adhérent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Niveau
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Période
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Séances
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
              {paginatedFormations.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <FiX className="w-12 h-12 text-gray-300" />
                      <p>Aucune formation trouvée</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedFormations.map((formation, index) => {
                  const adherentName =
                    adherentMap[formation.num_adherent] ||
                    `#${formation.num_adherent}`;

                  return (
                    <motion.tr
                      key={formation.id_formation}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {adherentName}
                        </div>
                        <div className="text-xs text-gray-500">
                          #{formation.num_adherent}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full">
                          {formation.niveau_vise}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div className="flex flex-col">
                          <span>Début: {formatDate(formation.date_debut)}</span>
                          <span className="text-xs text-gray-400">
                            Fin: {formatDate(formation.date_fin_prevue)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            {formation.nb_seances_realisees}
                          </span>
                          {formation.statut === "En cours" && (
                            <button
                              onClick={() =>
                                handleIncrementSession(formation.id_formation)
                              }
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Ajouter une séance"
                            >
                              <FiClock className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={formation.statut} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-1">
                          {formation.statut === "En cours" && (
                            <button
                              onClick={() =>
                                handleComplete(formation.id_formation)
                              }
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Terminer"
                            >
                              <FiCheck className="w-4 h-4" />
                            </button>
                          )}
                          <Link
                            to={`/formations/${formation.id_formation}`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <FiEye className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/formations/edit/${formation.id_formation}`}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          >
                            <FiEdit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(formation.id_formation)}
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

export default FormationList;
