import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiEdit, FiArrowLeft, FiUser, FiCalendar, FiUserCheck, FiFileText, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { useCertificats } from '../../hooks/useCertificats';
import LoadingSpinner from '../Common/LoadingSpinner';
import StatusBadge from '../Common/StatusBadge';
import { formatDate } from '../../utils/helpers';

const CertificatDetails = ({ id }) => {
  const navigate = useNavigate();
  const { useGetById } = useCertificats();
  const { data, isLoading, error } = useGetById(id);
  const [certificat, setCertificat] = useState(null);

  useEffect(() => {
    if (data?.data) {
      setCertificat(data.data);
    }
  }, [data]);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">Erreur: {error.message}</div>;
  if (!certificat) return <div className="text-center py-8">Certificat non trouvé</div>;

  const isExpired = new Date(certificat.date_validite) < new Date();

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
          onClick={() => navigate('/certificats')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <FiArrowLeft className="w-4 h-4" />
          Retour à la liste
        </button>
        <Link
          to={`/certificats/edit/${certificat.id_certificat}`}
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
              Certificat #{certificat.id_certificat}
            </h1>
            <p className="text-gray-500 mt-1">
              {certificat.type_certificat} - Dr. {certificat.medecin}
            </p>
          </div>
          <StatusBadge status={certificat.statut} />
        </div>
      </div>

      {/* Informations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Informations générales</h3>
          <div className="space-y-3">
            <InfoItem icon={FiUser} label="Adhérent" value={`#${certificat.num_adherent}`} highlight />
            <InfoItem icon={FiFileText} label="Type" value={certificat.type_certificat} />
            <InfoItem icon={FiUserCheck} label="Médecin" value={certificat.medecin} />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Dates</h3>
          <div className="space-y-3">
            <InfoItem icon={FiCalendar} label="Date de délivrance" value={formatDate(certificat.date_delivrance)} />
            <InfoItem 
              icon={FiCalendar} 
              label="Date de validité" 
              value={formatDate(certificat.date_validite)}
              highlight={!isExpired}
            />
            <InfoItem 
              icon={isExpired ? FiXCircle : FiCheckCircle} 
              label="Statut" 
              value={isExpired ? 'Expiré' : 'Valide'}
              highlight={!isExpired}
            />
          </div>
        </div>
      </div>

      {/* Statut */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Statut du certificat</h3>
        <div className={`flex items-center gap-4 p-4 rounded-xl ${isExpired ? 'bg-red-50' : 'bg-green-50'}`}>
          <div className={`p-3 rounded-full ${isExpired ? 'bg-red-100' : 'bg-green-100'}`}>
            {isExpired ? (
              <FiXCircle className="w-6 h-6 text-red-600" />
            ) : (
              <FiCheckCircle className="w-6 h-6 text-green-600" />
            )}
          </div>
          <div>
            <p className={`font-medium ${isExpired ? 'text-red-800' : 'text-green-800'}`}>
              {isExpired ? 'Certificat expiré' : 'Certificat valide'}
            </p>
            <p className="text-sm text-gray-600">
              {isExpired 
                ? `Expiré depuis le ${formatDate(certificat.date_validite)}` 
                : `Valable jusqu'au ${formatDate(certificat.date_validite)}`}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CertificatDetails;