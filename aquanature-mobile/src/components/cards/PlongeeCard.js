// src/components/cards/PlongeeCard.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { formatDate } from '../../utils/helpers';

const PlongeeCard = ({ plongee, onPress }) => {
  const { colors } = useTheme();
  const isValidated = !!plongee.id_moniteur_validateur;
  const CardWrapper = onPress ? TouchableOpacity : View;

  return (
    <CardWrapper
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.row}>
        <LinearGradient colors={[colors.primary + 'CC', colors.ocean]} style={styles.iconCircle}>
          <Ionicons name="water" size={22} color="#fff" />
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.type, { color: colors.text }]}>
              {plongee.type_plongee}
            </Text>
            <View style={[
              styles.validationBadge,
              { backgroundColor: isValidated ? colors.success + '20' : colors.warning + '20' }
            ]}>
              <Ionicons
                name={isValidated ? 'checkmark-circle' : 'time-outline'}
                size={13}
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
              <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
              <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                {formatDate(plongee.date)}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="speedometer-outline" size={13} color={colors.textSecondary} />
              <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                {plongee.profondeur_max}m
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
              <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                {plongee.duree}min
              </Text>
            </View>
          </View>
        </View>
      </View>
    </CardWrapper>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap',
    gap: 6,
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
    gap: 14,
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
