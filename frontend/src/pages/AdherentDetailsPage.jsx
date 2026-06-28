import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import AdherentDetails from '../components/Adherent/AdherentDetails';

const AdherentDetailsPage = () => {
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

      <AdherentDetails id={id} />
    </motion.div>
  );
};

export default AdherentDetailsPage;