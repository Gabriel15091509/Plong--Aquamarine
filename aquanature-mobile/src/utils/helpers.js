// src/utils/helpers.js

/**
 * Formate une date en string lisible
 */
export const formatDate = (date) => {
  if (!date) return '—';
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Formate une date et heure
 */
export const formatDateTime = (date) => {
  if (!date) return '—';
  const d = new Date(date);
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Vérifie si une date est passée
 */
export const isPast = (date) => {
  return new Date(date) < new Date();
};

/**
 * Vérifie si une date est future
 */
export const isUpcoming = (date) => {
  return new Date(date) > new Date();
};

/**
 * Formate un montant en euros
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '—';
  return `${amount.toFixed(2)} €`;
};

/**
 * Retourne la couleur d'un statut
 */
export const getStatusColor = (status) => {
  const colors = {
    'En attente': '#ff9800',
    'Confirmée': '#4caf50',
    'Annulée': '#f44336',
    'Liste d\'attente': '#2196f3',
    'Valide': '#4caf50',
    'Expiré': '#f44336',
    'Actif': '#4caf50',
    'Inactif': '#9e9e9e',
    'Suspendu': '#ff9800',
  };
  return colors[status] || '#9e9e9e';
};

/**
 * Tronque un texte
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Valide un email
 */
export const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};