import React from 'react';
import { motion } from 'framer-motion';
import InscriptionList from '../components/Inscription/InscriptionList';

const InscriptionsPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Inscriptions</h1>
        <p className="text-gray-500 mt-1">Gestion des inscriptions aux sorties</p>
      </div>

      <InscriptionList />
    </motion.div>
  );
};

export default InscriptionsPage;