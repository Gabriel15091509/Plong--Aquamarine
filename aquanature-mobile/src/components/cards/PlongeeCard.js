// src/components/cards/PlongeeCard.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { formatDate } from '../../utils/helpers';

const PlongeeCard = ({ plongee }) => {
  const { colors } = useTheme();
  const isValidated = plongee.valide_moniteur;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={styles.typeContainer}>
          <Ionicons name="water" size={16} color={colors.primary} />
          <Text style={[styles.type, { color: colors.primary }]}>
            {plongee.type_plongee}
          </Text>
        </View>
        <View style={[
          styles.validationBadge, 
          { backgroundColor: isValidated ? colors.success + '20' : colors.warning + '20' }
        ]}>
          <Ionicons 
            name={isValidated ? 'checkmark-circle' : 'time-outline'} 
            size={14} 
            color={isValidated ? colors.success : colors.warning} 
          />
          <Text style={[
            styles.validationText, 
            { color: isValidated ? colors.success : colors.warning }
          ]}>
            {isValidated ? 'Validée' : 'En attente'}
          </Text>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            {formatDate(plongee.date)}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="speedometer-outline" size={14} color={colors.textSecondary} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            {plongee.profondeur_max}m
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            {plongee.duree}min
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
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
    fontSize: 15,
    fontWeight: '600',
  },
  validationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  validationText: {
    fontSize: 11,
    fontWeight: '500',
  },
  details: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 13,
  },
});

export default PlongeeCard;