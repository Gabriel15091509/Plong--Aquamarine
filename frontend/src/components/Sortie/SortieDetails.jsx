import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiEdit, FiArrowLeft, FiCalendar, FiMapPin, FiUsers, FiClock, FiDollarSign, FiFileText, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { useSorties } from '../../hooks/useSorties';
import LoadingSpinner from '../Common/LoadingSpinner';
import StatusBadge from '../Common/StatusBadge';
import { formatDate, formatDateTime, formatCurrency } from '../../utils/helpers';

const SortieDetails = ({ id }) => {
  const navigate = useNavigate();
  const { useGetById } = useSorties();
  const { data, isLoading, error } = useGetById(id);
  const [sortie, setSortie] = useState(null);

  useEffect(() => {
    if (data?.data) {
      setSortie(data.data);
    }
  }, [data]);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">Erreur: {error.message}</div>;
  if (!sortie) return <div className="text-center py-8">Sortie non trouvée</div>;

  const InfoItem = ({ icon: Icon, label, value, highlight = false }) => (
    <div className={`flex items-start gap-3 p-3 rounded-xl ${highlight ? 'bg-primary-50' : ''}`}>
      <div className="text-gray-400 mt-1">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="font-medium text-gray-900">{value || 'Non défini'}</p>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/sorties')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <FiArrowLeft className="w-4 h-4" />
          Retour à la liste
        </button>
        <Link
          to={`/sorties/edit/${sortie.id_sortie}`}
          className="btn-primary flex items-center gap-2"
        >
          <FiEdit className="w-4 h-4" />
          Modifier
        </Link>
      </div>

      {/* Titre */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Sortie #{sortie.id_sortie}
            </h1>
            <p className="text-gray-500 mt-1">
              {sortie.type} - {sortie.lieu} ({sortie.site})
            </p>
          </div>
          <StatusBadge status={sortie.statut} />
        </div>
      </div>

      {/* Informations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Informations générales</h3>
          <div className="space-y-3">
            <InfoItem icon={FiCalendar} label="Date et heure" value={formatDateTime(sortie.date_heure)} highlight />
            <InfoItem icon={FiMapPin} label="Lieu" value={sortie.lieu} />
            <InfoItem icon={FiMapPin} label="Site" value={sortie.site} />
            <InfoItem icon={FiFileText} label="Type" value={sortie.type} />
            <InfoItem icon={FiFileText} label="Niveau requis" value={sortie.niveau_requis} />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Détails pratiques</h3>
          <div className="space-y-3">
            <InfoItem icon={FiUsers} label="Nombre de places" value={sortie.nb_places} />
            <InfoItem icon={FiClock} label="Profondeur max" value={`${sortie.profondeur_max}m`} />
            <InfoItem icon={FiClock} label="Durée estimée" value={sortie.duree_estimee} />
            <InfoItem icon={FiDollarSign} label="Tarif" value={formatCurrency(sortie.tarif)} />
            <InfoItem icon={FiCalendar} label="Ouverture des inscriptions" value={formatDate(sortie.date_ouverture_inscriptions)} />
          </div>
        </div>
      </div>

      {/* Description */}
      {sortie.description_site && (
        <div className="bg-white rounded-2xl shadow-card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Description du site</h3>
          <p className="text-gray-600 leading-relaxed">{sortie.description_site}</p>
        </div>
      )}

      {/* Conditions */}
      {sortie.condition_affectation && (
        <div className="bg-white rounded-2xl shadow-card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Conditions d'affectation</h3>
          <p className="text-gray-600 leading-relaxed">{sortie.condition_affectation}</p>
        </div>
      )}
    </motion.div>
  );
};

export default SortieDetails;