import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiEye,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiCheck,
  FiX,
  FiAlertCircle,
} from "react-icons/fi";
import { useCertificats } from "../../hooks/useCertificats";
import { useAdherents } from "../../hooks/useAdherents";
import StatusBadge from "../Common/StatusBadge";
import Pagination from "../Common/Pagination";
import LoadingSpinner from "../Common/LoadingSpinner";
import SearchBar from "../Common/SearchBar";
import { formatDate } from "../../utils/helpers";

const CertificatList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState("all");
  const itemsPerPage = 10;

  const { useGetAll, useRemove } = useCertificats();
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

  let certificats = data?.data || [];

  // ✅ Filtrage avec recherche par nom d'adhérent, type ou médecin
  certificats = certificats.filter((c) => {
    const adherentName = adherentMap[c.num_adherent] || "";
    const matchSearch =
      c.type_certificat?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.medecin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adherentName.toLowerCase().includes(searchTerm.toLowerCase());
    if (filter === "all") return matchSearch;
    return matchSearch && c.statut === filter;
  });

  const totalPages = Math.ceil(certificats.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCertificats = certificats.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce certificat ?")) {
      await remove.mutateAsync(id);
    }
  };

  const isExpired = (date) => {
    return new Date(date) < new Date();
  };

  const getDaysRemaining = (date) => {
    const today = new Date();
    const expiryDate = new Date(date);
    const diffTime = expiryDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Rechercher par adhérent, type ou médecin..."
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input-field w-auto"
          >
            <option value="all">Tous</option>
            <option value="Valide">Valides</option>
            <option value="Expiré">Expirés</option>
            <option value="En attente">En attente</option>
          </select>
          <Link
            to="/certificats/create"
            className="btn-primary flex items-center gap-2"
          >
            <FiPlus className="w-4 h-4" /> Nouveau
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
                  Validité
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Médecin
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
              {paginatedCertificats.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <FiX className="w-12 h-12 text-gray-300" />
                      <p>Aucun certificat trouvé</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedCertificats.map((certificat, index) => {
                  const adherentName =
                    adherentMap[certificat.num_adherent] ||
                    `#${certificat.num_adherent}`;
                  const expired = isExpired(certificat.date_validite);
                  const daysRemaining = getDaysRemaining(
                    certificat.date_validite,
                  );

                  return (
                    <motion.tr
                      key={certificat.id_certificat}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                          {certificat.type_certificat}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {adherentName}
                        </div>
                        <div className="text-xs text-gray-500">
                          #{certificat.num_adherent}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-600">
                            {formatDate(certificat.date_validite)}
                          </span>
                          {expired ? (
                            <span className="text-xs text-red-500 font-medium flex items-center gap-1">
                              <FiAlertCircle className="w-3 h-3" /> Expiré
                            </span>
                          ) : daysRemaining <= 30 ? (
                            <span className="text-xs text-orange-500 font-medium">
                              Expire dans {daysRemaining} jours
                            </span>
                          ) : (
                            <span className="text-xs text-green-500 font-medium">
                              Valide
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {certificat.medecin}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={certificat.statut} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <Link
                            to={`/certificats/${certificat.id_certificat}`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <FiEye className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/certificats/edit/${certificat.id_certificat}`}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          >
                            <FiEdit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() =>
                              handleDelete(certificat.id_certificat)
                            }
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

export default CertificatList;
