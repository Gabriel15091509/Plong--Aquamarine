import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiEdit, FiArrowLeft, FiUser, FiCalendar, FiDollarSign, FiCreditCard, FiFileText, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { usePaiements } from '../../hooks/usePaiements';
import LoadingSpinner from '../Common/LoadingSpinner';
import StatusBadge from '../Common/StatusBadge';
import { formatDate, formatCurrency } from '../../utils/helpers';

const PaiementDetails = ({ id }) => {
  const navigate = useNavigate();
  const { useGetById } = usePaiements();
  const { data, isLoading, error } = useGetById(id);
  const [paiement, setPaiement] = useState(null);

  useEffect(() => {
    if (data?.data) {
      setPaiement(data.data);
    }
  }, [data]);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">Erreur: {error.message}</div>;
  if (!paiement) return <div className="text-center py-8">Paiement non trouvé</div>;

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
          onClick={() => navigate('/paiements')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <FiArrowLeft className="w-4 h-4" />
          Retour à la liste
        </button>
        <Link
          to={`/paiements/edit/${paiement.id_paiement}`}
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
              Paiement #{paiement.id_paiement}
            </h1>
            <p className="text-gray-500 mt-1">
              {paiement.motif} - {formatCurrency(paiement.montant)}
            </p>
          </div>
          <StatusBadge status={paiement.statut} />
        </div>
      </div>

      {/* Informations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Informations générales</h3>
          <div className="space-y-3">
            <InfoItem icon={FiUser} label="Adhérent" value={`#${paiement.num_adherent}`} highlight />
            <InfoItem icon={FiFileText} label="Motif" value={paiement.motif} />
            <InfoItem icon={FiDollarSign} label="Montant" value={formatCurrency(paiement.montant)} />
            <InfoItem icon={FiCreditCard} label="Mode de paiement" value={paiement.mode} />
            <InfoItem icon={FiFileText} label="Référence" value={paiement.reference || 'Non renseignée'} />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Dates</h3>
          <div className="space-y-3">
            <InfoItem icon={FiCalendar} label="Date du paiement" value={formatDate(paiement.date_paiement)} />
            <InfoItem 
              icon={paiement.statut === 'Validé' ? FiCheckCircle : FiXCircle} 
              label="Statut" 
              value={paiement.statut}
              highlight={paiement.statut === 'Validé'}
            />
          </div>
        </div>
      </div>

      {/* Statut */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Statut du paiement</h3>
        <div className={`flex items-center gap-4 p-4 rounded-xl ${
          paiement.statut === 'Validé' ? 'bg-green-50' : 
          paiement.statut === 'Annulé' ? 'bg-red-50' : 
          'bg-yellow-50'
        }`}>
          <div className={`p-3 rounded-full ${
            paiement.statut === 'Validé' ? 'bg-green-100' : 
            paiement.statut === 'Annulé' ? 'bg-red-100' : 
            'bg-yellow-100'
          }`}>
            {paiement.statut === 'Validé' ? (
              <FiCheckCircle className="w-6 h-6 text-green-600" />
            ) : paiement.statut === 'Annulé' ? (
              <FiXCircle className="w-6 h-6 text-red-600" />
            ) : (
              <FiCheckCircle className="w-6 h-6 text-yellow-600" />
            )}
          </div>
          <div>
            <p className={`font-medium ${
              paiement.statut === 'Validé' ? 'text-green-800' : 
              paiement.statut === 'Annulé' ? 'text-red-800' : 
              'text-yellow-800'
            }`}>
              {paiement.statut === 'Validé' ? 'Paiement validé' : 
               paiement.statut === 'Annulé' ? 'Paiement annulé' : 
               'Paiement en attente'}
            </p>
            <p className="text-sm text-gray-600">
              {paiement.statut === 'Validé' ? 'Le paiement a été validé avec succès' : 
               paiement.statut === 'Annulé' ? 'Le paiement a été annulé' : 
               'Le paiement est en cours de traitement'}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PaiementDetails;