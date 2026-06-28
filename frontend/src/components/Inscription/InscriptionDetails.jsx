import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiEdit, FiArrowLeft, FiUser, FiCalendar, FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi';
import { useInscriptions } from '../../hooks/useInscriptions';
import LoadingSpinner from '../Common/LoadingSpinner';
import StatusBadge from '../Common/StatusBadge';
import { formatDate } from '../../utils/helpers';

const InscriptionDetails = ({ id }) => {
  const navigate = useNavigate();
  const { useGetById } = useInscriptions();
  const { data, isLoading, error } = useGetById(id);
  const [inscription, setInscription] = useState(null);

  useEffect(() => {
    if (data?.data) {
      setInscription(data.data);
    }
  }, [data]);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">Erreur: {error.message}</div>;
  if (!inscription) return <div className="text-center py-8">Inscription non trouvée</div>;

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
          onClick={() => navigate('/inscriptions')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <FiArrowLeft className="w-4 h-4" />
          Retour à la liste
        </button>
        <Link
          to={`/inscriptions/edit/${inscription.id_inscription}`}
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
              Inscription #{inscription.id_inscription}
            </h1>
            <p className="text-gray-500 mt-1">
              Adhérent #{inscription.num_adherent} - Sortie #{inscription.id_sortie}
            </p>
          </div>
          <StatusBadge status={inscription.statut} />
        </div>
      </div>

      {/* Informations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Informations générales</h3>
          <div className="space-y-3">
            <InfoItem icon={FiUser} label="Adhérent" value={`#${inscription.num_adherent}`} highlight />
            <InfoItem icon={FiCalendar} label="Sortie" value={`#${inscription.id_sortie}`} />
            <InfoItem icon={FiCalendar} label="Date d'inscription" value={formatDate(inscription.date_inscription)} />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Statut</h3>
          <div className="space-y-3">
            <InfoItem 
              icon={inscription.statut === 'Confirmée' ? FiCheckCircle : FiClock} 
              label="Statut" 
              value={inscription.statut}
              highlight={inscription.statut === 'Confirmée'}
            />
            {inscription.rang_liste_attente && (
              <InfoItem icon={FiClock} label="Rang liste d'attente" value={inscription.rang_liste_attente} />
            )}
            <InfoItem 
              icon={inscription.presence ? FiCheckCircle : FiXCircle} 
              label="Présence" 
              value={inscription.presence ? 'Présent' : 'Absent'}
            />
            {inscription.date_confirmation && (
              <InfoItem icon={FiCalendar} label="Date de confirmation" value={formatDate(inscription.date_confirmation)} />
            )}
          </div>
        </div>
      </div>

      {/* Statut */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Statut de l'inscription</h3>
        <div className={`flex items-center gap-4 p-4 rounded-xl ${
          inscription.statut === 'Confirmée' ? 'bg-green-50' : 
          inscription.statut === 'Annulée' ? 'bg-red-50' : 
          inscription.statut === "Liste d'attente" ? 'bg-yellow-50' : 
          'bg-blue-50'
        }`}>
          <div className={`p-3 rounded-full ${
            inscription.statut === 'Confirmée' ? 'bg-green-100' : 
            inscription.statut === 'Annulée' ? 'bg-red-100' : 
            inscription.statut === "Liste d'attente" ? 'bg-yellow-100' : 
            'bg-blue-100'
          }`}>
            {inscription.statut === 'Confirmée' ? (
              <FiCheckCircle className="w-6 h-6 text-green-600" />
            ) : inscription.statut === 'Annulée' ? (
              <FiXCircle className="w-6 h-6 text-red-600" />
            ) : (
              <FiClock className="w-6 h-6 text-yellow-600" />
            )}
          </div>
          <div>
            <p className={`font-medium ${
              inscription.statut === 'Confirmée' ? 'text-green-800' : 
              inscription.statut === 'Annulée' ? 'text-red-800' : 
              inscription.statut === "Liste d'attente" ? 'text-yellow-800' : 
              'text-blue-800'
            }`}>
              {inscription.statut}
            </p>
            <p className="text-sm text-gray-600">
              {inscription.statut === 'Confirmée' ? 'L\'inscription est confirmée' : 
               inscription.statut === 'Annulée' ? 'L\'inscription a été annulée' : 
               inscription.statut === "Liste d'attente" ? 'En attente de disponibilité' : 
               'En attente de confirmation'}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default InscriptionDetails;