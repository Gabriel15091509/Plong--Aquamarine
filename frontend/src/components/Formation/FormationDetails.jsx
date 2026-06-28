import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiEdit, FiArrowLeft, FiUser, FiCalendar, FiAward, FiClock, FiCheckCircle, FiXCircle, FiFileText } from 'react-icons/fi';
import { useFormations } from '../../hooks/useFormations';
import LoadingSpinner from '../Common/LoadingSpinner';
import StatusBadge from '../Common/StatusBadge';
import { formatDate } from '../../utils/helpers';

const FormationDetails = ({ id }) => {
  const navigate = useNavigate();
  const { useGetById } = useFormations();
  const { data, isLoading, error } = useGetById(id);
  const [formation, setFormation] = useState(null);

  useEffect(() => {
    if (data?.data) {
      setFormation(data.data);
    }
  }, [data]);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">Erreur: {error.message}</div>;
  if (!formation) return <div className="text-center py-8">Formation non trouvée</div>;

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
          onClick={() => navigate('/formations')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <FiArrowLeft className="w-4 h-4" />
          Retour à la liste
        </button>
        <Link
          to={`/formations/edit/${formation.id_formation}`}
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
              Formation #{formation.id_formation}
            </h1>
            <p className="text-gray-500 mt-1">
              Niveau {formation.niveau_vise} - {formation.nb_seances_realisees} séances réalisées
            </p>
          </div>
          <StatusBadge status={formation.statut} />
        </div>
      </div>

      {/* Informations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Informations générales</h3>
          <div className="space-y-3">
            <InfoItem icon={FiUser} label="Adhérent" value={`#${formation.num_adherent}`} highlight />
            <InfoItem icon={FiAward} label="Niveau visé" value={formation.niveau_vise} />
            <InfoItem icon={FiCalendar} label="Date de début" value={formatDate(formation.date_debut)} />
            <InfoItem icon={FiCalendar} label="Date fin prévue" value={formatDate(formation.date_fin_prevue)} />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Progression</h3>
          <div className="space-y-3">
            <InfoItem icon={FiClock} label="Séances réalisées" value={formation.nb_seances_realisees} />
            <InfoItem 
              icon={formation.statut === 'Terminée' ? FiCheckCircle : FiClock} 
              label="Statut" 
              value={formation.statut}
              highlight={formation.statut === 'Terminée'}
            />
          </div>
        </div>
      </div>

      {/* Commentaire */}
      {formation.commentaire_moniteur && (
        <div className="bg-white rounded-2xl shadow-card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Commentaire du moniteur</h3>
          <p className="text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-xl">
            {formation.commentaire_moniteur}
          </p>
        </div>
      )}

      {/* Statut */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Statut de la formation</h3>
        <div className={`flex items-center gap-4 p-4 rounded-xl ${
          formation.statut === 'Terminée' ? 'bg-green-50' : 
          formation.statut === 'Abandonnée' ? 'bg-red-50' : 
          formation.statut === 'Suspendue' ? 'bg-yellow-50' : 
          'bg-blue-50'
        }`}>
          <div className={`p-3 rounded-full ${
            formation.statut === 'Terminée' ? 'bg-green-100' : 
            formation.statut === 'Abandonnée' ? 'bg-red-100' : 
            formation.statut === 'Suspendue' ? 'bg-yellow-100' : 
            'bg-blue-100'
          }`}>
            {formation.statut === 'Terminée' ? (
              <FiCheckCircle className="w-6 h-6 text-green-600" />
            ) : formation.statut === 'Abandonnée' ? (
              <FiXCircle className="w-6 h-6 text-red-600" />
            ) : (
              <FiClock className="w-6 h-6 text-blue-600" />
            )}
          </div>
          <div>
            <p className={`font-medium ${
              formation.statut === 'Terminée' ? 'text-green-800' : 
              formation.statut === 'Abandonnée' ? 'text-red-800' : 
              formation.statut === 'Suspendue' ? 'text-yellow-800' : 
              'text-blue-800'
            }`}>
              {formation.statut === 'Terminée' ? 'Formation terminée' : 
               formation.statut === 'Abandonnée' ? 'Formation abandonnée' : 
               formation.statut === 'Suspendue' ? 'Formation suspendue' : 
               'Formation en cours'}
            </p>
            <p className="text-sm text-gray-600">
              {formation.statut === 'Terminée' ? 'La formation a été complétée avec succès' : 
               formation.statut === 'Abandonnée' ? 'La formation a été abandonnée' : 
               formation.statut === 'Suspendue' ? 'La formation est temporairement suspendue' : 
               `${formation.nb_seances_realisees} séances réalisées sur ${formation.nb_seances_realisees + 5} prévues`}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default FormationDetails;