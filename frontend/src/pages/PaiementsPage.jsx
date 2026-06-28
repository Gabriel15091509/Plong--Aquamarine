import React from 'react';
import { motion } from 'framer-motion';
import PaiementList from '../components/Paiement/PaiementList';

const PaiementsPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Paiements</h1>
        <p className="text-gray-500 mt-1">Gestion des paiements</p>
      </div>

      <PaiementList />
    </motion.div>
  );
};

export default PaiementsPage;