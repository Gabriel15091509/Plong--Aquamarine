import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiEye, FiEdit, FiTrash2, FiPlus, FiTool } from 'react-icons/fi';
import { useMateriels } from '../../hooks/useMateriels';
import StatusBadge from '../Common/StatusBadge';
import Pagination from '../Common/Pagination';
import LoadingSpinner from '../Common/LoadingSpinner';
import SearchBar from '../Common/SearchBar';
import { formatDate } from '../../utils/helpers';

const MaterielList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState('all');
  const itemsPerPage = 10;
  
  const { useGetAll, useRemove } = useMateriels();
  const { data, isLoading, error } = useGetAll();
  const remove = useRemove();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">Erreur: {error.message}</div>;

  let materiels = data?.data || [];

  materiels = materiels.filter(m => {
    const matchSearch = 
      m.marque?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.modele?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.num_inventaire?.toLowerCase().includes(searchTerm.toLowerCase());
    if (filter === 'all') return matchSearch;
    return matchSearch && m.etat === filter;
  });

  const totalPages = Math.ceil(materiels.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMateriels = materiels.slice(startIndex, startIndex + itemsPerPage);

  const handleDelete = async (numInventaire) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce matériel ?')) {
      await remove.mutateAsync(numInventaire);
    }
  };

  const getEtatColor = (etat) => {
    const colors = {
      'Neuf': 'text-green-600 bg-green-50',
      'Bon': 'text-blue-600 bg-blue-50',
      'Usagé': 'text-yellow-600 bg-yellow-50',
      'À réparer': 'text-orange-600 bg-orange-50',
      'Hors service': 'text-red-600 bg-red-50'
    };
    return colors[etat] || 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Rechercher du matériel..." />
        </div>
        <div className="flex gap-2">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input-field w-auto">
            <option value="all">Tous</option>
            <option value="Neuf">Neuf</option>
            <option value="Bon">Bon</option>
            <option value="Usagé">Usagé</option>
            <option value="À réparer">À réparer</option>
            <option value="Hors service">Hors service</option>
          </select>
          <Link to="/materiels/create" className="btn-primary flex items-center gap-2">
            <FiPlus className="w-4 h-4" /> Nouveau
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N° Inventaire</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catégorie</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marque / Modèle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">État</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Localisation</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedMateriels.map((materiel, index) => (
                <motion.tr key={materiel.num_inventaire} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{materiel.num_inventaire}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                      {materiel.categorie}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{materiel.marque}</div>
                    <div className="text-xs text-gray-500">{materiel.modele}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEtatColor(materiel.etat)}`}>
                      {materiel.etat}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{materiel.localisation}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      <Link to={`/materiels/${materiel.num_inventaire}`} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                        <FiEye className="w-4 h-4" />
                      </Link>
                      <Link to={`/materiels/edit/${materiel.num_inventaire}`} className="p-2 text-green-600 hover:bg-green-50 rounded-lg">
                        <FiEdit className="w-4 h-4" />
                      </Link>
                      <button onClick={() => handleDelete(materiel.num_inventaire)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
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

export default MaterielList;