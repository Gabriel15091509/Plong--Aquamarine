import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiEdit, FiArrowLeft, FiUser, FiCalendar, FiDollarSign, FiFileText, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { useAdhesions } from '../../hooks/useAdhesions';
import LoadingSpinner from '../Common/LoadingSpinner';
import StatusBadge from '../Common/StatusBadge';
import { formatDate, formatCurrency } from '../../utils/helpers';

const AdhesionDetails = ({ id }) => {
  const navigate = useNavigate();
  const { useGetById } = useAdhesions();
  const { data, isLoading, error } = useGetById(id);
  const [adhesion, setAdhesion] = useState(null);

  useEffect(() => {
    if (data?.data) {
      setAdhesion(data.data);
    }
  }, [data]);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">Erreur: {error.message}</div>;
  if (!adhesion) return <div className="text-center py-8">Adhésion non trouvée</div>;

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
          onClick={() => navigate('/adhesions')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <FiArrowLeft className="w-4 h-4" />
          Retour à la liste
        </button>
        <Link
          to={`/adhesions/edit/${adhesion.id_adhesion}`}
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
              Adhésion #{adhesion.id_adhesion}
            </h1>
            <p className="text-gray-500 mt-1">
              {adhesion.type} - {formatDate(adhesion.date_debut)} au {formatDate(adhesion.date_fin)}
            </p>
          </div>
          <StatusBadge status={adhesion.statut_paiement} />
        </div>
      </div>

      {/* Informations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Informations générales</h3>
          <div className="space-y-3">
            <InfoItem icon={FiUser} label="Adhérent" value={`#${adhesion.num_adherent}`} highlight />
            <InfoItem icon={FiFileText} label="Type" value={adhesion.type} />
            <InfoItem icon={FiDollarSign} label="Montant" value={formatCurrency(adhesion.montant_paye)} />
            <InfoItem icon={FiCalendar} label="Année" value={adhesion.annee_adhesion} />
            <InfoItem icon={FiFileText} label="N° Licence FFESM" value={adhesion.num_licence_ffesm || 'Non renseigné'} />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Période</h3>
          <div className="space-y-3">
            <InfoItem icon={FiCalendar} label="Date de début" value={formatDate(adhesion.date_debut)} />
            <InfoItem icon={FiCalendar} label="Date de fin" value={formatDate(adhesion.date_fin)} />
            <InfoItem 
              icon={adhesion.statut_paiement === 'Payé' ? FiCheckCircle : FiXCircle} 
              label="Statut paiement" 
              value={adhesion.statut_paiement}
              highlight={adhesion.statut_paiement === 'Payé'}
            />
          </div>
        </div>
      </div>

      {/* Statut */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Statut de l'adhésion</h3>
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
          <div className={`p-3 rounded-full ${adhesion.statut_paiement === 'Payé' ? 'bg-green-100' : 'bg-yellow-100'}`}>
            {adhesion.statut_paiement === 'Payé' ? (
              <FiCheckCircle className="w-6 h-6 text-green-600" />
            ) : (
              <FiXCircle className="w-6 h-6 text-yellow-600" />
            )}
          </div>
          <div>
            <p className="font-medium text-gray-800">
              {adhesion.statut_paiement === 'Payé' ? 'Adhésion payée' : 'Adhésion en attente de paiement'}
            </p>
            <p className="text-sm text-gray-500">
              {adhesion.statut_paiement === 'Payé' 
                ? 'Tous les paiements ont été effectués' 
                : 'Le paiement n\'a pas encore été finalisé'}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdhesionDetails;