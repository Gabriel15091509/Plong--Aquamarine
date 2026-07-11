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
    

      <AdherentDetails id={id} />
    </motion.div>
  );
};

export default AdherentDetailsPage;