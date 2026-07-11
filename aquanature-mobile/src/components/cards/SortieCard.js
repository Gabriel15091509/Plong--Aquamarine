// src/components/cards/SortieCard.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { formatDateTime, isUpcoming } from '../../utils/helpers';

const SortieCard = ({ sortie, onPress }) => {
  const { colors } = useTheme();
  const isFull = (sortie.nb_inscrits || 0) >= (sortie.nb_places || 0);
  const isFuture = isUpcoming(sortie.date_heure);

  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.typeContainer}>
          <Ionicons name="boat" size={16} color={colors.primary} />
          <Text style={[styles.type, { color: colors.primary }]}>
            {sortie.type || 'Sortie'}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: isFuture ? colors.primaryLight : colors.border }]}>
          <Text style={[styles.statusText, { color: isFuture ? colors.primary : colors.textSecondary }]}>
            {isFuture ? 'À venir' : 'Passée'}
          </Text>
        </View>
      </View>

      <Text style={[styles.lieu, { color: colors.text }]}>{sortie.lieu}</Text>
      {sortie.site && (
        <Text style={[styles.site, { color: colors.textSecondary }]}>{sortie.site}</Text>
      )}

      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            {formatDateTime(sortie.date_heure)}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="people-outline" size={14} color={colors.textSecondary} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            {sortie.nb_inscrits || 0}/{sortie.nb_places || 0}
          </Text>
        </View>
        {isFull && (
          <View style={[styles.fullBadge, { backgroundColor: colors.error + '20' }]}>
            <Text style={[styles.fullText, { color: colors.error }]}>Complet</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  type: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  lieu: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  site: {
    fontSize: 14,
    marginBottom: 8,
  },
  details: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 4,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 13,
  },
  fullBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  fullText: {
    fontSize: 11,
    fontWeight: '600',
  },
});

export default SortieCard;