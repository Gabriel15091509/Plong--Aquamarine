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
  FiFileText,
  FiUser,
  FiCalendar,
  FiClock,
  FiSearch,
} from "react-icons/fi";
import { useCertificats } from "../../hooks/useCertificats";
import { useAdherents } from "../../hooks/useAdherents";
import StatusBadge from "../Common/StatusBadge";
import Pagination from "../Common/Pagination";
import LoadingSpinner from "../Common/LoadingSpinner";
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

  const allCertificats = data?.data || [];

  const filteredCertificats = useMemo(() => {
    return allCertificats.filter((c) => {
      const adherentName = adherentMap[c.num_adherent] || "";
      const searchLower = searchTerm.toLowerCase();
      const matchSearch =
        c.type_certificat?.toLowerCase().includes(searchLower) ||
        c.medecin?.toLowerCase().includes(searchLower) ||
        adherentName.toLowerCase().includes(searchLower);
      if (filter === "all") return matchSearch;
      return matchSearch && c.statut === filter;
    });
  }, [allCertificats, adherentMap, searchTerm, filter]);

  const stats = useMemo(() => {
    const total = filteredCertificats.length;
    const valides = filteredCertificats.filter((c) => {
      if (c.statut === "Valide") return true;
      if (c.statut === "En attente") return false;
      return new Date(c.date_validite) > new Date();
    }).length;
    const expires = filteredCertificats.filter((c) => {
      if (c.statut === "Expiré") return true;
      return new Date(c.date_validite) < new Date();
    }).length;
    const enAttente = filteredCertificats.filter(
      (c) => c.statut === "En attente",
    ).length;
    return { total, valides, expires, enAttente };
  }, [filteredCertificats]);

  const totalPages = Math.ceil(filteredCertificats.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCertificats = filteredCertificats.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const handleDelete = async (id) => {
    if (window.confirm("Confirmer la suppression de ce certificat ?")) {
      await remove.mutateAsync(id);
    }
  };

  const isExpired = (date) => new Date(date) < new Date();
  const getDaysRemaining = (date) => {
    const diffTime = new Date(date) - new Date();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const isLoadingData = isLoading || loadingAdherents;
  if (isLoadingData) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">Erreur: {error.message}</div>;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* En-tête avec filtres */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Recherche */}
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Rechercher..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all"
            />
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
              <option value="all">Tous ({stats.total})</option>
              <option value="Valide">Valides ({stats.valides})</option>
              <option value="Expiré">Expirés ({stats.expires})</option>
              <option value="En attente">En attente ({stats.enAttente})</option>
            </select>

            <Link
              to="/certificats/create"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <FiPlus className="w-4 h-4" />
              Nouveau
            </Link>
          </div>
        </div>

        {/* Statistiques mini */}
        <div className="flex gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
          <span>
            Total:{" "}
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {stats.total}
            </span>
          </span>
          <span>
            Valides:{" "}
            <span className="font-medium text-green-600">{stats.valides}</span>
          </span>
          <span>
            Expirés:{" "}
            <span className="font-medium text-red-600">{stats.expires}</span>
          </span>
          <span>
            En attente:{" "}
            <span className="font-medium text-yellow-600">
              {stats.enAttente}
            </span>
          </span>
        </div>
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto">
        {filteredCertificats.length === 0 ? (
          <div className="text-center py-16">
            <FiFileText className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              Aucun certificat trouvé
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
              <tr>
                {["Type", "Adhérent", "Validité", "Médecin", "Statut", ""].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {paginatedCertificats.map((certificat, index) => {
                const adherentName =
                  adherentMap[certificat.num_adherent] ||
                  `#${certificat.num_adherent}`;
                const expired = isExpired(certificat.date_validite);
                const daysRemaining = getDaysRemaining(
                  certificat.date_validite,
                );

                let statusText = "Valide";
                let statusColor = "text-green-600";
                if (expired) {
                  statusText = "Expiré";
                  statusColor = "text-red-600";
                } else if (daysRemaining <= 30) {
                  statusText = `${daysRemaining} jours`;
                  statusColor = "text-orange-600";
                }

                return (
                  <motion.tr
                    key={certificat.id_certificat}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded-full">
                        <FiFileText className="w-3 h-3" />
                        {certificat.type_certificat}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {adherentName}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        #{certificat.num_adherent}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {formatDate(certificat.date_validite)}
                      </div>
                      <div className={`text-xs font-medium ${statusColor}`}>
                        {expired ? (
                          <span className="flex items-center gap-1">
                            <FiAlertCircle className="w-3 h-3" /> Expiré
                          </span>
                        ) : daysRemaining <= 30 ? (
                          <span className="flex items-center gap-1">
                            <FiClock className="w-3 h-3" /> {statusText}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <FiCheck className="w-3 h-3" /> Valide
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {certificat.medecin || "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge status={certificat.statut} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Link
                          to={`/certificats/${certificat.id_certificat}`}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Voir"
                        >
                          <FiEye className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/certificats/edit/${certificat.id_certificat}`}
                          className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <FiEdit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(certificat.id_certificat)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        )}
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

export default CertificatList;
