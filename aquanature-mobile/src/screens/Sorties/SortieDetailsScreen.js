// src/screens/Sorties/SortieDetailsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
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

// Reprend la logique de couleur par statut de SortieDetails.jsx (getStatutColor/Icon)
const STATUT_META = {
  Planifiée: { icon: 'calendar', light: ['#eff6ff', '#bfdbfe'], dark: ['#1e3a8a33', '#1e40af'] },
  Confirmée: { icon: 'checkmark-circle', light: ['#f0fdf4', '#bbf7d0'], dark: ['#14532d33', '#15803d'] },
  Annulée: { icon: 'close-circle', light: ['#fef2f2', '#fecaca'], dark: ['#7f1d1d33', '#b91c1c'] },
  Terminée: { icon: 'trending-up', light: ['#f9fafb', '#e5e7eb'], dark: ['#37415133', '#4b5563'] },
  Reportée: { icon: 'time', light: ['#fefce8', '#fef08a'], dark: ['#713f1233', '#a16207'] },
};

const STATUT_TEXT = {
  Planifiée: 'La sortie est planifiée et en attente',
  Confirmée: 'La sortie est confirmée et prête',
  Annulée: 'La sortie a été annulée',
  Terminée: 'La sortie est terminée',
  Reportée: 'La sortie a été reportée à une date ultérieure',
};

const SortieDetailsScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { sortieId } = route.params;
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [sortie, setSortie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inscriptionStatus, setInscriptionStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadSortie = async () => {
    try {
      const response = await sorties.getDetails(sortieId);
      setSortie(response.data.data);

      if (user) {
        const inscResponse = await inscriptions.getMine();
        const existing = inscResponse.data.data?.find(
          (i) => i.id_sortie === sortieId
        );
        setInscriptionStatus(existing?.statut || null);
      }
    } catch (error) {
      console.error('Erreur chargement sortie:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSortie();
  }, [sortieId]);

  const handleInscription = async () => {
    if (!user) {
      Alert.alert('Connexion requise', 'Veuillez vous connecter pour vous inscrire');
      return;
    }

    Alert.alert(
      'Confirmation',
      'Voulez-vous vous inscrire à cette sortie ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'S\'inscrire',
          onPress: async () => {
            setSubmitting(true);
            try {
              await inscriptions.create({
                num_adherent: user.num_adherent,
                id_sortie: sortieId,
                statut: 'En attente',
              });
              setInscriptionStatus('En attente');
              Alert.alert('Succès', 'Inscription envoyée en attente de confirmation');
              loadSortie();
            } catch (error) {
              Alert.alert('Erreur', error.response?.data?.message || 'Erreur lors de l\'inscription');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const handleDesinscription = async () => {
    Alert.alert(
      'Confirmation',
      'Voulez-vous annuler votre inscription ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Annuler l\'inscription',
          style: 'destructive',
          onPress: async () => {
            setSubmitting(true);
            try {
              const resp = await inscriptions.getMine();
              const insc = resp.data.data?.find(i => i.id_sortie === sortieId);
              if (insc) {
                await inscriptions.cancel(insc.id_inscription);
                setInscriptionStatus(null);
                Alert.alert('Succès', 'Inscription annulée');
                loadSortie();
              }
            } catch (error) {
              Alert.alert('Erreur', 'Erreur lors de l\'annulation');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  if (loading) return <LoadingSpinner />;
  if (!sortie) return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 12 }]}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={22} color={colors.text} />
      </TouchableOpacity>
      <Text style={[styles.errorText, { color: colors.error }]}>
        Sortie non trouvée
      </Text>
    </View>
  );

  const isFull = (sortie.nb_inscrits || 0) >= (sortie.nb_places || 0);
  const isPastSortie = isPast(sortie.date_heure);
  // Meme regle que le backend (InscriptionService.createInscription) : on ne
  // peut s'inscrire que si la sortie est encore au stade "Planifiée" — une
  // fois "En cours"/"Terminée"/"Annulée"/"Reportée", les inscriptions n'ont
  // plus de sens meme si la date n'est pas encore passée.
  const isNotPlanifiee = sortie.statut !== 'Planifiée';
  const canInscribe = !isPastSortie && !isFull && !inscriptionStatus && !isNotPlanifiee;
  const placesDisponibles = sortie.places_disponibles ?? Math.max((sortie.nb_places || 0) - (sortie.nb_inscrits || 0), 0);
  const statutMeta = STATUT_META[sortie.statut] || STATUT_META['Planifiée'];
  const [statutBg, statutBorder] = isDark ? statutMeta.dark : statutMeta.light;

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
          <Ionicons name="boat" size={22} color={colors.primary} />
        </View>
        <View style={styles.headerTextWrap}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {sortie.type} <Text style={{ color: colors.primary }}>- {sortie.lieu}</Text>
          </Text>
          <Text style={[styles.headerMeta, { color: colors.textSecondary }]}>
            N°{sortie.id_sortie} · {sortie.site} · {formatDateTime(sortie.date_heure)}
          </Text>
        </View>
      </View>

      {/* Carte statut */}
      <View style={[styles.statutCard, { backgroundColor: statutBg, borderColor: statutBorder }]}>
        <View style={styles.statutRow}>
          <View style={[styles.statutIconWrap, { backgroundColor: statutBorder + '40' }]}>
            <Ionicons name={statutMeta.icon} size={26} color={colors.text} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.statutLabel, { color: colors.text }]}>{sortie.statut}</Text>
            <Text style={[styles.statutSubtext, { color: colors.textSecondary }]}>
              {STATUT_TEXT[sortie.statut] || 'Statut inconnu'}
            </Text>
          </View>
        </View>
        <View style={styles.statutStats}>
          <View style={styles.statutStatItem}>
            <Text style={[styles.statutStatValue, { color: colors.text }]}>{sortie.nb_places}</Text>
            <Text style={[styles.statutStatLabel, { color: colors.textSecondary }]}>Places</Text>
          </View>
          <View style={[styles.statutDivider, { backgroundColor: statutBorder }]} />
          <View style={styles.statutStatItem}>
            <Text style={[styles.statutStatValue, { color: colors.text }]}>{sortie.profondeur_max}m</Text>
            <Text style={[styles.statutStatLabel, { color: colors.textSecondary }]}>Profondeur max</Text>
          </View>
        </View>
      </View>

      {/* Informations générales */}
      <SectionCard title="Informations générales" icon="information-circle-outline">
        <InfoItem icon="pricetag-outline" label="Type de sortie" value={sortie.type} highlight />
        <InfoItem icon="calendar-outline" label="Date et heure" value={formatDateTime(sortie.date_heure)} />
        <InfoItem icon="location-outline" label="Lieu" value={sortie.lieu} />
        <InfoItem icon="location-outline" label="Site" value={sortie.site} />
        <InfoItem icon="ribbon-outline" label="Niveau requis" value={sortie.niveau_requis || 'Tous niveaux'} />
        <InfoItem icon="people-outline" label="Nombre de places" value={`${sortie.nb_places} places`} />
        <InfoItem icon="water-outline" label="Profondeur max" value={`${sortie.profondeur_max} mètres`} />
        <InfoItem icon="time-outline" label="Durée estimée" value={sortie.duree_estimee || 'Non définie'} />
      </SectionCard>

      {/* Inscription */}
      <SectionCard title="Inscription" icon="people-circle-outline">
        <InfoItem
          icon="calendar-clear-outline"
          label="Ouverture des inscriptions"
          value={formatDateTime(sortie.date_ouverture_inscriptions)}
          highlight
        />
        <View style={styles.infoItem}>
          <View style={[styles.infoIconWrap, { backgroundColor: colors.background }]}>
            <Ionicons name="ribbon-outline" size={16} color={colors.textSecondary} />
          </View>
          <View style={styles.infoTextWrap}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Statut</Text>
            <StatusBadge status={sortie.statut} />
          </View>
        </View>
        <InfoItem
          icon="stats-chart-outline"
          label="Places disponibles"
          value={`${placesDisponibles} / ${sortie.nb_places} places${isFull ? ' (Complet)' : ''}`}
        />
      </SectionCard>

      {sortie.description_site && (
        <SectionCard title="Description du site" icon="document-text-outline">
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {sortie.description_site}
          </Text>
        </SectionCard>
      )}

      {sortie.condition_affectation && (
        <SectionCard title="Conditions d'affectation" icon="alert-circle-outline">
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {sortie.condition_affectation}
          </Text>
        </SectionCard>
      )}

      {/* Actions inscription (adhérent) */}
      <View style={[styles.actionsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {isPastSortie && (
          <View style={[styles.pastBadge, { backgroundColor: colors.border }]}>
            <Text style={[styles.pastText, { color: colors.textSecondary }]}>
              Cette sortie est passée
            </Text>
          </View>
        )}

        {inscriptionStatus && (
          <View style={[styles.inscriptionStatus, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.inscriptionStatusText, { color: colors.primary }]}>
              Vous êtes {inscriptionStatus.toLowerCase()}
            </Text>
            {!isPastSortie && (
              <TouchableOpacity onPress={handleDesinscription} disabled={submitting}>
                <Text style={[styles.cancelLink, { color: colors.error }]}>
                  Annuler
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {canInscribe && (
          <TouchableOpacity
            style={[styles.inscrireButton, { backgroundColor: colors.primary }]}
            onPress={handleInscription}
            disabled={submitting}
          >
            <Text style={styles.inscrireButtonText}>
              {submitting ? 'Inscription...' : "S'inscrire"}
            </Text>
          </TouchableOpacity>
        )}

        {isNotPlanifiee && !inscriptionStatus && !isPastSortie && (
          <View style={[styles.fullBadge, { backgroundColor: colors.error + '20' }]}>
            <Text style={[styles.fullText, { color: colors.error }]}>
              {sortie.statut === 'Annulée'
                ? 'Cette sortie est annulée - Inscription impossible'
                : "Les inscriptions ne sont plus ouvertes pour cette sortie"}
            </Text>
          </View>
        )}

        {isFull && !isNotPlanifiee && !inscriptionStatus && !isPastSortie && (
          <View style={[styles.fullBadge, { backgroundColor: colors.error + '20' }]}>
            <Text style={[styles.fullText, { color: colors.error }]}>
              Complet - Plus de places disponibles
            </Text>
          </View>
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
    fontSize: 19,
    fontWeight: 'bold',
  },
  headerMeta: {
    fontSize: 12,
    marginTop: 3,
  },
  statutCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 18,
    borderRadius: 18,
    borderWidth: 2,
  },
  statutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  statutIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statutLabel: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statutSubtext: {
    fontSize: 13,
    marginTop: 2,
  },
  statutStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  statutStatItem: {
    alignItems: 'center',
  },
  statutStatValue: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  statutStatLabel: {
    fontSize: 11,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  statutDivider: {
    width: 1,
    height: 32,
    opacity: 0.4,
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
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionsCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  inscrireButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  inscrireButtonText: {
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
  inscriptionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
  },
  inscriptionStatusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  cancelLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
});

export default SortieDetailsScreen;
