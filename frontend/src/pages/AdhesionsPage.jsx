import React from 'react';
import { motion } from 'framer-motion';
import AdhesionList from '../components/Adhesion/AdhesionList';

const AdhesionsPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Adhésions</h1>
        <p className="text-gray-500 mt-1">Gestion des adhésions des membres</p>
      </div>

      <AdhesionList />
    </motion.div>
  );
};

export default AdhesionsPage;