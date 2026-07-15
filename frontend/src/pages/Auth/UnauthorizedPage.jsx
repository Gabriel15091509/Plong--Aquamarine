import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiShield, FiHome, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

const UnauthorizedPage = () => {
  const { user } = useAuth();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4"
    >
      {/* Icône */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className="w-28 h-28 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6 shadow-lg"
      >
        <FiShield className="w-14 h-14 text-red-500 dark:text-red-400" />
      </motion.div>

      {/* Titre */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-3"
      >
        Accès non autorisé
      </motion.h1>

      {/* Message */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-gray-500 dark:text-gray-400 mb-2 max-w-md"
      >
        Vous n'avez pas les permissions nécessaires pour accéder à cette page.
      </motion.p>

      {/* Informations utilisateur */}
      {user && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6 max-w-md w-full"
        >
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Connecté en tant que : <span className="font-semibold text-gray-800 dark:text-white">{user.name}</span>
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Rôle : <span className="font-medium text-primary-600 dark:text-primary-400">
              {user.role === 'president' && 'Président'}
              {user.role === 'moniteur' && 'Moniteur'}
              {user.role === 'tresorier' && 'Trésorier'}
              {user.role === 'adherent' && 'Adhérent'}
            </span>
          </p>
        </motion.div>
      )}

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex flex-wrap gap-4 justify-center"
      >
        <Link
          to="/dashboard"
          className="btn-primary flex items-center gap-2"
        >
          <FiHome className="w-4 h-4" />
          Retour au tableau de bord
        </Link>
        <button
          onClick={() => window.history.back()}
          className="btn-secondary flex items-center gap-2"
        >
          <FiAlertCircle className="w-4 h-4" />
          Page précédente
        </button>
      </motion.div>

      {/* Code d'erreur */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-8 text-xs text-gray-400 dark:text-gray-500"
      >
        Erreur 403 - Accès refusé
      </motion.p>
    </motion.div>
  );
};

export default UnauthorizedPage;