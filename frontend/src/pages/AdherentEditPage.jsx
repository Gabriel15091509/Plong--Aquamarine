import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import AdherentForm from '../components/Adherent/AdherentForm';

const AdherentEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <button
        onClick={() => navigate('/adherents')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <FiArrowLeft className="w-4 h-4" />
        Retour
      </button>

      <div>
        <h1 className="text-2xl font-bold text-gray-800">Modifier l'adhérent</h1>
        <p className="text-gray-500 mt-1">Mettez à jour les informations de l'adhérent</p>
      </div>

      <AdherentForm editMode={true} adherentId={id} />
    </motion.div>
  );
};

export default AdherentEditPage;