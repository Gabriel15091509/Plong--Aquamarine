import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHome, FiSearch } from 'react-icons/fi';

const NotFoundPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[60vh] text-center"
    >
      <div className="text-8xl font-bold text-gray-200 mb-4">404</div>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Page non trouvée</h1>
      <p className="text-gray-500 mb-8 max-w-md">
        La page que vous recherchez n'existe pas ou a été déplacée.
      </p>
      <div className="flex gap-4">
        <Link to="/dashboard" className="btn-primary flex items-center gap-2">
          <FiHome className="w-4 h-4" />
          Retour au tableau de bord
        </Link>
        <button
          onClick={() => window.history.back()}
          className="btn-secondary flex items-center gap-2"
        >
          <FiSearch className="w-4 h-4" />
          Page précédente
        </button>
      </div>
    </motion.div>
  );
};

export default NotFoundPage;