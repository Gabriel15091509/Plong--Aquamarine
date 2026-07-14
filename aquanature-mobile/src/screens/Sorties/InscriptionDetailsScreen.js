// src/screens/Sorties/InscriptionDetailsScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { inscriptions } from '../../api/endpoints';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import { useTheme } from '../../context/ThemeContext';
import { formatDate, formatDateTime } from '../../utils/helpers';

// Reprend la logique de couleur/texte par statut de InscriptionDetails.jsx
// cote web (getStatutColor/Icon/Text).
const STATUT_META = {
  Confirmée: {
    icon: 'checkmark-circle',
    light: ['#f0fdf4', '#bbf7d0'],
    dark: ['#14532d33', '#15803d'],
    text: "L'inscription est confirmée et validée",
  },
  Annulée: {
    icon: 'close-circle',
    light: ['#fef2f2', '#fecaca'],
    dark: ['#7f1d1d33', '#b91c1c'],
    text: "L'inscription a été annulée",
  },
  "Liste d'attente": {
    icon: 'time',
    light: ['#fefce8', '#fef08a'],
    dark: ['#713f1233', '#a16207'],
    text: 'En attente d\'une place disponible',
  },
  'En attente': {
    icon: 'time',
    light: ['#eff6ff', '#bfdbfe'],
    dark: ['#1e3a8a33', '#1e40af'],
    text: 'En attente de confirmation par le moniteur',
  },
};

const InscriptionDetailsScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { inscriptionId } = route.params;
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [inscription, setInscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await inscriptions.getById(inscriptionId);
      setInscription(response.data.data);
    } catch (error) {
      console.log('Erreur chargement inscription:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  }, [inscriptionId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleCancel = () => {
    Alert.alert(
      'Confirmation',
      'Voulez-vous annuler cette inscription ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Annuler l\'inscription',
          style: 'destructive',
          onPress: async () => {
            setSubmitting(true);
            try {
              await inscriptions.cancel(inscriptionId);
              Alert.alert('Succès', 'Inscription annulée');
              load();
            } catch (error) {
              Alert.alert('Erreur', error.response?.data?.message || 'Erreur lors de l\'annulation');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  if (loading) return <LoadingSpinner />;

  if (!inscription) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.errorText, { color: colors.error }]}>
          Inscription non trouvée
        </Text>
      </View>
    );
  }

  const sortie = inscription.sortie;
  const statutMeta = STATUT_META[inscription.statut] || STATUT_META['En attente'];
  const [statutBg, statutBorder] = isDark ? statutMeta.dark : statutMeta.light;
  const canCancel = ['En attente', 'Confirmée', "Liste d'attente"].includes(inscription.statut);

  const InfoItem = ({ icon, label, value, highlight = false }) => (
    <View
      style={[
        styles.infoItem,
        highlight && { backgroundColor: colors.primary + '14', borderLeftWidth: 3, borderLeftColor: colors.primary },
      ]}
    >
      <View
        style={[
          styles.infoIconWrap,
          { backgroundColor: highlight ? colors.primary + '26' : colors.background },
        ]}
      >
        <Ionicons name={icon} size={16} color={highlight ? colors.primary : colors.textSecondary} />
      </View>
      <View style={styles.infoTextWrap}>
        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: colors.text }]}>{value || 'Non défini'}</Text>
      </View>
    </View>
  );

  const SectionCard = ({ title, icon, children }) => (
    <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.sectionTitleRow}>
        <View style={[styles.sectionIconWrap, { backgroundColor: colors.primary + '1a' }]}>
          <Ionicons name={icon} size={16} color={colors.primary} />
        </View>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      </View>
      {children}
    </View>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 24 }}
    >
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={22} color={colors.text} />
      </TouchableOpacity>

      {/* En-tête */}
      <View style={styles.header}>
        <View style={[styles.headerIconWrap, { backgroundColor: colors.primary + '1a' }]}>
          <Ionicons name="document-text" size={22} color={colors.primary} />
        </View>
        <View style={styles.headerTextWrap}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Inscription <Text style={{ color: colors.primary }}>N°{inscription.id_inscription}</Text>
          </Text>
          <Text style={[styles.headerMeta, { color: colors.textSecondary }]} numberOfLines={1}>
            {sortie ? `${sortie.type} - ${sortie.lieu}` : `Sortie N°${inscription.id_sortie}`}
          </Text>
        </View>
        <StatusBadge status={inscription.statut} />
      </View>

      {/* Carte statut */}
      <View style={[styles.statutCard, { backgroundColor: statutBg, borderColor: statutBorder }]}>
        <View style={styles.statutRow}>
          <View style={[styles.statutIconWrap, { backgroundColor: statutBorder + '40' }]}>
            <Ionicons name={statutMeta.icon} size={24} color={colors.text} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.statutLabel, { color: colors.text }]}>{inscription.statut}</Text>
            <Text style={[styles.statutSubtext, { color: colors.textSecondary }]}>{statutMeta.text}</Text>
          </View>
        </View>
        {inscription.rang_liste_attente && (
          <View style={[styles.rangBadge, { backgroundColor: colors.card }]}>
            <Text style={[styles.rangText, { color: colors.text }]}>
              Rang N°{inscription.rang_liste_attente}
            </Text>
          </View>
        )}
      </View>

      {/* Informations sortie */}
      {sortie && (
        <SectionCard title="Informations sortie" icon="boat-outline">
          <InfoItem icon="pricetag-outline" label="Type" value={sortie.type} highlight />
          <InfoItem icon="location-outline" label="Lieu" value={`${sortie.lieu}${sortie.site ? ' — ' + sortie.site : ''}`} />
          <InfoItem icon="calendar-outline" label="Date et heure" value={formatDateTime(sortie.date_heure)} />
          <InfoItem icon="water-outline" label="Profondeur max" value={`${sortie.profondeur_max || 0} mètres`} />
          <View style={styles.infoItem}>
            <View style={[styles.infoIconWrap, { backgroundColor: colors.background }]}>
              <Ionicons name="stats-chart-outline" size={16} color={colors.textSecondary} />
            </View>
            <View style={styles.infoTextWrap}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Statut de la sortie</Text>
              <StatusBadge status={sortie.statut} />
            </View>
          </View>
        </SectionCard>
      )}

      {/* Détails supplémentaires */}
      <SectionCard title="Détails de l'inscription" icon="checkmark-done-outline">
        <InfoItem icon="calendar-outline" label="Date d'inscription" value={formatDate(inscription.date_inscription)} highlight />
        <InfoItem
          icon={inscription.presence ? 'checkmark-circle-outline' : 'close-circle-outline'}
          label="Présence"
          value={
            inscription.presence_checked
              ? inscription.presence ? 'Présent' : 'Absent'
              : 'Non pointé'
          }
        />
        {inscription.date_confirmation && (
          <InfoItem icon="checkmark-circle-outline" label="Date de confirmation" value={formatDate(inscription.date_confirmation)} />
        )}
        <InfoItem
          icon="document-text-outline"
          label="Référence"
          value={`INS-${String(inscription.id_inscription).padStart(4, '0')}`}
        />
      </SectionCard>

      {/* Action annulation */}
      {canCancel && (
        <TouchableOpacity
          style={[styles.cancelButton, { borderColor: colors.error }]}
          onPress={handleCancel}
          disabled={submitting}
        >
          <Ionicons name="close-circle-outline" size={18} color={colors.error} />
          <Text style={[styles.cancelButtonText, { color: colors.error }]}>
            {submitting ? 'Annulation...' : "Annuler l'inscription"}
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    padding: 8,
    marginHorizontal: 12,
    alignSelf: 'flex-start',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  headerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerMeta: {
    fontSize: 12,
    marginTop: 3,
  },
  statutCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
  },
  statutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statutIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statutLabel: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  statutSubtext: {
    fontSize: 13,
    marginTop: 2,
  },
  rangBadge: {
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  rangText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sectionIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  infoIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  infoTextWrap: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
});

export default InscriptionDetailsScreen;
