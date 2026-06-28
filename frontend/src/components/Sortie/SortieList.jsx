import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiEye, FiEdit, FiTrash2, FiPlus, FiUsers, FiMapPin } from 'react-icons/fi';
import { useSorties } from '../../hooks/useSorties';
import StatusBadge from '../Common/StatusBadge';
import Pagination from '../Common/Pagination';
import LoadingSpinner from '../Common/LoadingSpinner';
import SearchBar from '../Common/SearchBar';
import { formatDateTime, formatCurrency } from '../../utils/helpers';

const SortieList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState('all');
  const itemsPerPage = 10;
  
  const { useGetAll, useRemove } = useSorties();
  const { data, isLoading, error } = useGetAll();
  const remove = useRemove();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">Erreur: {error.message}</div>;

  let sorties = data?.data || [];

  sorties = sorties.filter(s => {
    const matchSearch = 
      s.lieu?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.site?.toLowerCase().includes(searchTerm.toLowerCase());
    if (filter === 'all') return matchSearch;
    return matchSearch && s.statut === filter;
  });

  const totalPages = Math.ceil(sorties.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSorties = sorties.slice(startIndex, startIndex + itemsPerPage);

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette sortie ?')) {
      await remove.mutateAsync(id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Rechercher une sortie..." />
        </div>
        <div className="flex gap-2">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input-field w-auto">
            <option value="all">Toutes</option>
            <option value="Planifiée">Planifiées</option>
            <option value="En cours">En cours</option>
            <option value="Terminée">Terminées</option>
            <option value="Annulée">Annulées</option>
          </select>
          <Link to="/sorties/create" className="btn-primary flex items-center gap-2">
            <FiPlus className="w-4 h-4" /> Nouvelle
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sortie</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lieu</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Places</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarif</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedSorties.map((sortie, index) => (
                <motion.tr key={sortie.id_sortie} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{sortie.type}</div>
                    <div className="text-xs text-gray-500">Niv. {sortie.niveau_requis}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDateTime(sortie.date_heure)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{sortie.lieu}</div>
                    <div className="text-xs text-gray-500">{sortie.site}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{sortie.nb_places}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency(sortie.tarif)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={sortie.statut} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      <Link to={`/sorties/${sortie.id_sortie}`} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                        <FiEye className="w-4 h-4" />
                      </Link>
                      <Link to={`/sorties/edit/${sortie.id_sortie}`} className="p-2 text-green-600 hover:bg-green-50 rounded-lg">
                        <FiEdit className="w-4 h-4" />
                      </Link>
                      <button onClick={() => handleDelete(sortie.id_sortie)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
      </div>
    </div>
  );
};

export default SortieList;