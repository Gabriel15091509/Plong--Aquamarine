import React from 'react';
import { motion } from 'framer-motion';
import CertificatList from '../components/CertificatMedical/CertificatList';

const CertificatsPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Certificats Médicaux</h1>
        <p className="text-gray-500 mt-1">Gestion des certificats médicaux</p>
      </div>

      <CertificatList />
    </motion.div>
  );
};

export default CertificatsPage;