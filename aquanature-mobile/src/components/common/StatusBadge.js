// src/components/common/StatusBadge.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const StatusBadge = ({ status }) => {
  const getStatusConfig = () => {
    const configs = {
      'En attente': { color: '#ff9800', label: '⏳ En attente' },
      'Confirmée': { color: '#4caf50', label: '✅ Confirmée' },
      'Annulée': { color: '#f44336', label: '❌ Annulée' },
      'Liste d\'attente': { color: '#2196f3', label: '📋 En attente' },
      'Actif': { color: '#4caf50', label: '✅ Actif' },
      'Inactif': { color: '#9e9e9e', label: '⏸️ Inactif' },
      'Suspendu': { color: '#ff9800', label: '⏸️ Suspendu' },
      'Valide': { color: '#4caf50', label: '✅ Valide' },
      'Expiré': { color: '#f44336', label: '❌ Expiré' },
      'Planifiée': { color: '#2196f3', label: '📅 Planifiée' },
      'En cours': { color: '#4caf50', label: '🔄 En cours' },
      'Terminée': { color: '#9e9e9e', label: '✅ Terminée' },
    };
    return configs[status] || { color: '#9e9e9e', label: status || 'Inconnu' };
  };

  const config = getStatusConfig();

  return (
    <View style={[styles.badge, { backgroundColor: config.color + '20' }]}>
      <Text style={[styles.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
});

export default StatusBadge;