// src/screens/Sorties/InscriptionScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { sorties, inscriptions } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import { formatDateTime, isPast } from '../../utils/helpers';

const InscriptionScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { sortieId } = route.params;
  const { user } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [sortie, setSortie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadSortie = async () => {
      try {
        const response = await sorties.getDetails(sortieId);
        setSortie(response.data.data);
      } catch (err) {
        setError('Impossible de charger les détails de la sortie');
      } finally {
        setLoading(false);
      }
    };
    loadSortie();
  }, [sortieId]);

  const handleConfirm = async () => {
    setSubmitting(true);
    setError('');
    try {
      await inscriptions.create({
        num_adherent: user.num_adherent,
        id_sortie: sortieId,
      });
      setSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Erreur lors de l'inscription à la sortie"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (!sortie) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.errorText, { color: colors.error }]}>
          Sortie non trouvée
        </Text>
      </View>
    );
  }

  const isFull = (sortie.nb_inscrits || 0) >= (sortie.nb_places || 0);
  const isPastSortie = isPast(sortie.date_heure);
  // Meme regle que le backend (InscriptionService.createInscription) : la
  // sortie doit encore etre "Planifiée" pour accepter une inscription.
  const isNotPlanifiee = sortie.statut !== 'Planifiée';
  const placesDisponibles = sortie.places_disponibles ?? Math.max((sortie.nb_places || 0) - (sortie.nb_inscrits || 0), 0);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: insets.top + 12 }}
    >
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={22} color={colors.text} />
      </TouchableOpacity>

      <View style={[styles.content, { backgroundColor: colors.card }]}>
        <Text style={[styles.pageTitle, { color: colors.textSecondary }]}>
          Confirmer l'inscription
        </Text>
        <Text style={[styles.lieu, { color: colors.text }]}>{sortie.lieu}</Text>
        {sortie.site && (
          <Text style={[styles.site, { color: colors.textSecondary }]}>{sortie.site}</Text>
        )}

        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              {formatDateTime(sortie.date_heure)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="people-outline" size={20} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              {placesDisponibles}/{sortie.nb_places || 0} places disponibles
              {isFull && ' - Complet'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="speedometer-outline" size={20} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              Niveau requis : {sortie.niveau_requis || 'Tous niveaux'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="water-outline" size={20} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              Profondeur max : {sortie.profondeur_max} mètres
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
            <StatusBadge status={sortie.statut} />
          </View>
        </View>

        {error ? (
          <View style={[styles.errorBox, { backgroundColor: colors.error + '20' }]}>
            <Ionicons name="alert-circle" size={20} color={colors.error} />
            <Text style={[styles.errorBoxText, { color: colors.error }]}>{error}</Text>
          </View>
        ) : null}

        {success ? (
          <View style={[styles.successBox, { backgroundColor: colors.success + '20' }]}>
            <Ionicons name="checkmark-circle" size={32} color={colors.success} />
            <Text style={[styles.successTitle, { color: colors.success }]}>
              Inscription envoyée
            </Text>
            <Text style={[styles.successText, { color: colors.textSecondary }]}>
              Votre inscription est en attente de confirmation par le club.
            </Text>
            <TouchableOpacity
              style={[styles.confirmButton, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('SortiesList')}
            >
              <Text style={styles.confirmButtonText}>Retour aux sorties</Text>
            </TouchableOpacity>
          </View>
        ) : isPastSortie ? (
          <View style={[styles.pastBadge, { backgroundColor: colors.border }]}>
            <Text style={[styles.pastText, { color: colors.textSecondary }]}>
              Cette sortie est passée, l'inscription n'est plus possible.
            </Text>
          </View>
        ) : isNotPlanifiee ? (
          <View style={[styles.fullBadge, { backgroundColor: colors.error + '20' }]}>
            <Text style={[styles.fullText, { color: colors.error }]}>
              {sortie.statut === 'Annulée'
                ? 'Cette sortie est annulée - Inscription impossible'
                : "Les inscriptions ne sont plus ouvertes pour cette sortie"}
            </Text>
          </View>
        ) : isFull ? (
          <View style={[styles.fullBadge, { backgroundColor: colors.error + '20' }]}>
            <Text style={[styles.fullText, { color: colors.error }]}>
              Complet - Plus de places disponibles
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.confirmButton, { backgroundColor: colors.primary }]}
            onPress={handleConfirm}
            disabled={submitting}
          >
            <Text style={styles.confirmButtonText}>
              {submitting ? 'Envoi...' : "Confirmer mon inscription"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
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
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  content: {
    margin: 16,
    marginTop: 4,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  pageTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  lieu: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  site: {
    fontSize: 15,
    marginBottom: 16,
  },
  infoSection: {
    gap: 10,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 15,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorBoxText: {
    fontSize: 14,
    flex: 1,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  successBox: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 4,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  successText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  confirmButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  pastBadge: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  pastText: {
    fontSize: 14,
    fontWeight: '500',
  },
  fullBadge: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  fullText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default InscriptionScreen;
