import React from 'react';
import { motion } from 'framer-motion';

const statusColors = {
  'Actif': 'badge-success',
  'Inactif': 'badge-neutral',
  'Suspendu': 'badge-danger',
  'En attente': 'badge-warning',
  'Confirmée': 'badge-success',
  'Annulée': 'badge-danger',
  'Terminée': 'badge-info',
  'En cours': 'badge-warning',
  'Planifiée': 'badge-info',
  'Payé': 'badge-success',
  'Validé': 'badge-success',
  'Partiel': 'badge-warning',
  'Expiré': 'badge-danger',
  'Valide': 'badge-success'
};

const StatusBadge = ({ status }) => {
  const colorClass = statusColors[status] || 'badge-neutral';
  
  return (
    <motion.span
      initial={{ scale: 0.8 }}
      animate={{ scale: 1 }}
      className={`badge ${colorClass}`}
    >
      {status}
    </motion.span>
  );
};

export default StatusBadge;