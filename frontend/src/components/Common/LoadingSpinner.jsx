import React from 'react';
import { motion } from 'framer-motion';

const LoadingSpinner = () => {
  return (
    <div className="flex flex-col items-center justify-center h-64">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full"
      />
      <p className="mt-4 text-gray-500 animate-pulse">Chargement...</p>
    </div>
  );
};

export default LoadingSpinner;